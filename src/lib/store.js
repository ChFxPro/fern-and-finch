import seedItems from '../../data/seed-items.json'
import { supabase, supabaseConfigured } from './supabase.js'

const normalizeProduct = (row) => ({ ...row, price: Number(row.price) })

export async function listProducts({ includeHidden = false } = {}) {
  if (!supabaseConfigured) return seedItems.filter((item) => includeHidden || item.active)
  let query = supabase.from('products').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false })
  if (!includeHidden) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return data.map(normalizeProduct)
}

export async function createProduct(product) {
  if (!supabaseConfigured) throw new Error('The shop database is not connected yet.')
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return normalizeProduct(data)
}

export async function updateProduct(id, changes) {
  if (!supabaseConfigured) throw new Error('The shop database is not connected yet.')
  const { data, error } = await supabase.from('products').update(changes).eq('id', id).select().single()
  if (error) throw error
  return normalizeProduct(data)
}

export async function uploadProductImage(file) {
  if (!supabaseConfigured) throw new Error('The shop image library is not connected yet.')
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export async function checkAdmin() {
  if (!supabaseConfigured) return false
  const { data, error } = await supabase.rpc('is_store_admin')
  if (error) return false
  return Boolean(data)
}
