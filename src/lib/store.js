import seedItems from '../../data/seed-items.json'
import { supabase, supabaseConfigured } from './supabase.js'

const normalizeProduct = (row) => {
  const images = [...(row.product_images || [])]
    .sort((left, right) => left.position - right.position)
    .map((entry) => ({ ...entry, url: entry.image_url }))
  const fallback = row.image ? [{ image_url: row.image, url: row.image, alt_text: row.title, position: 0 }] : []
  return { ...row, price: Number(row.price), images: images.length ? images : fallback, image: images[0]?.image_url || row.image }
}

export async function listProducts({ includeHidden = false } = {}) {
  if (!supabaseConfigured) return seedItems.filter((item) => includeHidden || item.active).map(normalizeProduct)
  let query = supabase.from('products').select('*, product_images(*)').order('featured', { ascending: false }).order('created_at', { ascending: false })
  if (!includeHidden) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return data.map(normalizeProduct)
}

export async function createProduct(product) {
  if (!supabaseConfigured) throw new Error('The shop database is not connected yet.')
  const { images = [], ...productRow } = product
  const { data, error } = await supabase.from('products').insert(productRow).select().single()
  if (error) throw error
  if (images.length) {
    const imageRows = images.map((image, position) => ({
      product_id: data.id,
      image_url: image.url,
      storage_path: image.path,
      alt_text: productRow.title,
      position,
    }))
    const { error: imageError } = await supabase.from('product_images').insert(imageRows)
    if (imageError) {
      await supabase.from('products').delete().eq('id', data.id)
      throw imageError
    }
  }
  return normalizeProduct({ ...data, product_images: images.map((image, position) => ({ image_url: image.url, storage_path: image.path, alt_text: productRow.title, position })) })
}

export async function updateProduct(id, changes) {
  if (!supabaseConfigured) throw new Error('The shop database is not connected yet.')
  const { data, error } = await supabase.from('products').update(changes).eq('id', id).select('*, product_images(*)').single()
  if (error) throw error
  return normalizeProduct(data)
}

export async function uploadProductImage(file) {
  if (!supabaseConfigured) throw new Error('The shop image library is not connected yet.')
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return { path, url: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl }
}

export async function uploadProductImages(files) {
  const results = await Promise.allSettled(files.map(uploadProductImage))
  const uploaded = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  const failed = results.find((result) => result.status === 'rejected')
  if (failed) {
    await removeProductImages(uploaded.map((image) => image.path))
    throw failed.reason
  }
  return uploaded
}

export async function removeProductImages(paths) {
  if (!supabaseConfigured || !paths.length) return
  await supabase.storage.from('product-images').remove(paths)
}

export async function checkAdmin() {
  if (!supabaseConfigured) return false
  const { data, error } = await supabase.rpc('is_store_admin')
  if (error) return false
  return Boolean(data)
}
