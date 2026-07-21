'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/admin-fetch'
import { Plus, Trash2 } from 'lucide-react'

interface Category { id: string; name: string; slug: string }

interface WeightOption {
  value: string
  price: number
  salePrice: number | null
}

interface ProductData {
  id?: string
  name: string
  slug: string
  description: string
  shortDesc: string
  price: number
  salePrice: number | null
  images: string
  categorySlug: string
  stock: number
  lowStock: number
  sku: string
  gstPct: number
  featured: boolean
  bestSeller: boolean
  isNew: boolean
  isActive: boolean
  tags: string
  variants: string
  nutrition: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  categories: Category[]
  initial?: Partial<ProductData>
}

const EMPTY: ProductData = {
  name: '', slug: '', description: '', shortDesc: '', price: 0, salePrice: null,
  images: '', categorySlug: '', stock: 100, lowStock: 10, sku: '', gstPct: 0,
  featured: false, bestSeller: false, isNew: false, isActive: true,
  tags: '', variants: '', nutrition: '',
}

export function ProductForm({ open, onClose, onSaved, categories, initial }: Props) {
  const [form, setForm] = useState<ProductData>(() => {
    const base = { ...EMPTY, ...initial }
    if (Array.isArray(base.images)) {
      base.images = base.images.join(', ')
    }
    if (Array.isArray(base.tags)) {
      base.tags = base.tags.join(', ')
    }
    return base as unknown as ProductData
  })
  const [saving, setSaving] = useState(false)

  const [weightOptions, setWeightOptions] = useState<WeightOption[]>(() => {
    try {
      const parsed = typeof initial?.variants === 'string' 
        ? JSON.parse(initial.variants) 
        : (initial?.variants || [])
      
      const weightVar = parsed.find((v: any) => v.type === 'Weight')
      if (weightVar) {
        return weightVar.options.map((o: any) => {
          if (typeof o === 'object' && o) {
            return {
              value: o.value || '',
              price: Number(o.price) || 0,
              salePrice: o.salePrice != null ? Number(o.salePrice) : null
            }
          }
          return {
            value: String(o),
            price: Number(initial?.price) || 0,
            salePrice: initial?.salePrice != null ? Number(initial.salePrice) : null
          }
        })
      }
    } catch (err) {
      console.error('Error parsing initial variants:', err)
    }
    return []
  })

  const [flavorString, setFlavorString] = useState<string>(() => {
    try {
      const parsed = typeof initial?.variants === 'string' 
        ? JSON.parse(initial.variants) 
        : (initial?.variants || [])
      const flavorVar = parsed.find((v: any) => v.type === 'Flavor')
      if (flavorVar) {
        return flavorVar.options.map((o: any) => typeof o === 'object' ? o.value : String(o)).join(', ')
      }
    } catch {}
    return ''
  })

  const [nutrition, setNutrition] = useState(() => {
    try {
      const parsed = typeof initial?.nutrition === 'string' && initial.nutrition
        ? JSON.parse(initial.nutrition)
        : (initial?.nutrition || {})
      return {
        calories: parsed.calories || '',
        protein: parsed.protein || '',
        fat: parsed.fat || '',
        carbs: parsed.carbs || '',
        fiber: parsed.fiber || '',
      }
    } catch {
      return { calories: '', protein: '', fat: '', carbs: '', fiber: '' }
    }
  })

  const isEdit = !!form.id

  function set(key: keyof ProductData, value: unknown) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !isEdit) {
        next.slug = String(value).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      return next
    })
  }

  // Weight Option handlers
  function addWeightOption() {
    setWeightOptions(prev => [
      ...prev,
      { value: '', price: Number(form.price) || 0, salePrice: form.salePrice ? Number(form.salePrice) : null }
    ])
  }

  function updateWeightOption(index: number, key: keyof WeightOption, val: any) {
    setWeightOptions(prev => prev.map((opt, i) => {
      if (i !== index) return opt
      if (key === 'value') return { ...opt, value: val }
      if (key === 'salePrice') return { ...opt, salePrice: val === '' ? null : Number(val) }
      return { ...opt, price: Number(val) || 0 }
    }))
  }

  function removeWeightOption(index: number) {
    setWeightOptions(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const finalVariants: any[] = []
      if (weightOptions.length > 0) {
        finalVariants.push({
          type: 'Weight',
          options: weightOptions.map(o => ({
            value: o.value,
            price: Number(o.price) || 0,
            salePrice: o.salePrice != null ? Number(o.salePrice) : null
          }))
        })
      }
      const flavors = flavorString.split(',').map(s => s.trim()).filter(Boolean)
      if (flavors.length > 0) {
        finalVariants.push({
          type: 'Flavor',
          options: flavors
        })
      }

      const imagesVal = typeof form.images === 'string'
        ? form.images.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(form.images) ? form.images : [])

      const tagsVal = typeof form.tags === 'string'
        ? form.tags.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(form.tags) ? form.tags : [])

      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock),
        lowStock: Number(form.lowStock),
        gstPct: Number(form.gstPct) || 0,
        images: imagesVal,
        tags: tagsVal,
        variants: finalVariants,
        nutrition: nutrition,
      }

      const url = isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'
      await adminFetch(url, { method, body: JSON.stringify(payload) })
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSaved()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => set('slug', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Short Description</Label>
            <Input value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sale Price (₹)</Label>
              <Input type="number" value={form.salePrice ?? ''} onChange={e => set('salePrice', e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => set('sku', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>GST % (slab — prices are inclusive)</Label>
              <Input type="number" step="0.5" value={form.gstPct} onChange={e => set('gstPct', e.target.value)} />
              <p className="text-xs text-neutral-400">e.g. 5, 12, 18. Set the product's GST slab; the storefront will show the CGST/SGST breakdown.</p>
            </div>
          </div>

          {/* Weight Variants & Dynamic Pricing */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold text-stone-800">Weight Options & Pricing</Label>
                <p className="text-[10px] text-stone-500 font-medium">Add weights (e.g. 500g) with their specific prices. This overrides the default product price.</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="h-8 border-stone-300 text-stone-700 font-semibold" onClick={addWeightOption}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Weight
              </Button>
            </div>
            
            {weightOptions.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {weightOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-stone-200 shadow-sm">
                    <div className="flex-1">
                      <Input
                        placeholder="e.g. 500g"
                        value={opt.value}
                        onChange={e => updateWeightOption(idx, 'value', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={opt.price || ''}
                        onChange={e => updateWeightOption(idx, 'price', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Sale (opt)"
                        value={opt.salePrice ?? ''}
                        onChange={e => updateWeightOption(idx, 'salePrice', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeWeightOption(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic text-center py-4">No weight variants added. Default product price will be used.</p>
            )}
          </div>

          {/* Flavor Options */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-stone-700">Flavor Options (comma-separated)</Label>
            <Input
              placeholder="e.g. Plain Roasted, Salted, Peri Peri"
              value={flavorString}
              onChange={e => setFlavorString(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Low Stock Threshold</Label>
              <Input type="number" value={form.lowStock} onChange={e => set('lowStock', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.categorySlug} onValueChange={v => set('categorySlug', v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Image URLs (comma-separated)</Label>
            <Input value={form.images} onChange={e => set('images', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>

          {/* Nutritional Values */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-4">
            <div>
              <Label className="text-sm font-bold text-stone-800">Nutritional Values (per 100g)</Label>
              <p className="text-[10px] text-stone-500 font-medium">Add approximate nutritional values for this product.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-stone-600">Calories</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. 340 kcal"
                  value={nutrition.calories}
                  onChange={e => setNutrition(prev => ({ ...prev, calories: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-600">Protein</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. 15g"
                  value={nutrition.protein}
                  onChange={e => setNutrition(prev => ({ ...prev, protein: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-600">Total Fat</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. 8g"
                  value={nutrition.fat}
                  onChange={e => setNutrition(prev => ({ ...prev, fat: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-600">Carbs</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. 60g"
                  value={nutrition.carbs}
                  onChange={e => setNutrition(prev => ({ ...prev, carbs: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-600">Fiber</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. 5g"
                  value={nutrition.fiber}
                  onChange={e => setNutrition(prev => ({ ...prev, fiber: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['featured', 'bestSeller', 'isNew', 'isActive'] as const).map(key => (
              <div key={key} className="flex items-center justify-between border rounded-md px-3 py-2">
                <Label>{key === 'isActive' ? 'Active' : key === 'bestSeller' ? 'Best Seller' : key === 'isNew' ? 'New' : 'Featured'}</Label>
                <Switch checked={!!form[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
