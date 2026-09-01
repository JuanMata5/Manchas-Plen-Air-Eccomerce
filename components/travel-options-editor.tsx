'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TravelOptionGroup, TravelPaymentMode } from '@/lib/types'

interface OptionGroupEditorProps {
  groups: TravelOptionGroup[]
  onChange: (groups: TravelOptionGroup[]) => void
}

export function OptionGroupEditor({ groups, onChange }: OptionGroupEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addGroup = () => {
    const newGroup: TravelOptionGroup = {
      id: `group-${Date.now()}`,
      name: 'Nueva categoría',
      category: 'optional',
      type: 'radio',
      maxOptions: 3,
      options: [
        { id: `opt-${Date.now()}`, name: 'Opción 1', priceModifier: 0 },
      ],
      isRequired: false,
    }
    onChange([...groups, newGroup])
  }

  const removeGroup = (id: string) => {
    onChange(groups.filter((g) => g.id !== id))
  }

  const updateGroup = (id: string, updates: Partial<TravelOptionGroup>) => {
    onChange(
      groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      )
    )
  }

  const addOption = (groupId: string) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: [
              ...g.options,
              {
                id: `opt-${Date.now()}`,
                name: 'Nueva opción',
                priceModifier: 0,
              },
            ],
          }
        }
        return g
      })
    )
  }

  const removeOption = (groupId: string, optionId: string) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.filter((o) => o.id !== optionId),
          }
        }
        return g
      })
    )
  }

  const updateOption = (groupId: string, optionId: string, updates: any) => {
    onChange(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.map((o) =>
              o.id === optionId ? { ...o, ...updates } : o
            ),
          }
        }
        return g
      })
    )
  }

  const categoryLabels: Record<string, string> = {
    accommodation: '🏠 Alojamiento',
    transport: '✈️ Traslado aéreo',
    companion: '👥 Acompañante',
    discount: '🎟️ Descuentos especiales',
    optional: '🌄 Opcionales',
    payment: '💳 Modalidad de pago',
  }

  return (
    <div className="space-y-4">
      <Button type="button" onClick={addGroup} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Agregar categoría de opciones
      </Button>

      {groups.map((group) => (
        <Card key={group.id} className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                className="flex items-center gap-2 flex-1 cursor-pointer text-left"
              >
                {expandedId === group.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <CardTitle className="text-base">
                  {categoryLabels[group.category] || group.name}
                </CardTitle>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeGroup(group.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {expandedId === group.id && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={group.name}
                    onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={group.category}
                    onValueChange={(value) =>
                      updateGroup(group.id, {
                        category: value as TravelOptionGroup['category'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accommodation">🏠 Alojamiento</SelectItem>
                      <SelectItem value="transport">✈️ Traslado aéreo</SelectItem>
                      <SelectItem value="companion">👥 Acompañante</SelectItem>
                      <SelectItem value="discount">🎟️ Descuentos especiales</SelectItem>
                      <SelectItem value="optional">🌄 Opcionales</SelectItem>
                      <SelectItem value="payment">💳 Modalidad de pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de selección</Label>
                  <Select
                    value={group.type}
                    onValueChange={(value) =>
                      updateGroup(group.id, { type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radio">Selección única (Radio)</SelectItem>
                      <SelectItem value="checkbox">Múltiple (Checkbox)</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Máximo de opciones</Label>
                  <Input
                    type="number"
                    value={group.maxOptions || 3}
                    onChange={(e) =>
                      updateGroup(group.id, {
                        maxOptions: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={group.description || ''}
                  onChange={(e) => updateGroup(group.id, { description: e.target.value })}
                  rows={2}
                  placeholder="Descripción opcional"
                />
              </div>

              {/* Opciones */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Opciones ({group.options.length})</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addOption(group.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Agregar
                  </Button>
                </div>

                {group.options.map((option, idx) => (
                  <div key={option.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        Opción {idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeOption(group.id, option.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Nombre de la opción"
                        value={option.name}
                        onChange={(e) =>
                          updateOption(group.id, option.id, {
                            name: e.target.value,
                          })
                        }
                        size="sm"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        placeholder={group.category === 'discount' ? 'Descuento %' : 'Modificador de precio'}
                        value={option.priceModifier}
                        onChange={(e) =>
                          updateOption(group.id, option.id, {
                            priceModifier: parseFloat(e.target.value) || 0,
                          })
                        }
                        size="sm"
                        className="text-sm"
                      />
                    </div>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

interface PaymentModesEditorProps {
  modes: TravelPaymentMode[]
  onChange: (modes: TravelPaymentMode[]) => void
}

export function PaymentModesEditor({ modes, onChange }: PaymentModesEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addMode = () => {
    const newMode: TravelPaymentMode = {
      id: `mode-${Date.now()}`,
      name: 'Nueva modalidad',
      priceModifier: 0,
    }
    onChange([...modes, newMode])
  }

  const removeMode = (id: string) => {
    onChange(modes.filter((m) => m.id !== id))
  }

  const updateMode = (id: string, updates: Partial<TravelPaymentMode>) => {
    onChange(
      modes.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
    )
  }

  return (
    <div className="space-y-4">
      <Button type="button" onClick={addMode} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Agregar modalidad de pago
      </Button>

      {modes.map((mode) => (
        <Card key={mode.id} className="border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === mode.id ? null : mode.id)}
                className="flex items-center gap-2 flex-1 cursor-pointer text-left"
              >
                {expandedId === mode.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <CardTitle className="text-base">💳 {mode.name}</CardTitle>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMode(mode.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {expandedId === mode.id && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={mode.name}
                    onChange={(e) => updateMode(mode.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modificador de precio</Label>
                  <Input
                    type="number"
                    value={mode.priceModifier}
                    onChange={(e) =>
                      updateMode(mode.id, {
                        priceModifier: parseFloat(e.target.value) || 0,
                      })
                    }
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad de cuotas (opcional)</Label>
                  <Input
                    type="number"
                    value={mode.installments || ''}
                    onChange={(e) =>
                      updateMode(mode.id, {
                        installments: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ej: 3"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de interés (opcional)</Label>
                  <Input
                    type="number"
                    value={mode.installmentRate || ''}
                    onChange={(e) =>
                      updateMode(mode.id, {
                        installmentRate: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ej: 0.05 (5%)"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={mode.description || ''}
                  onChange={(e) => updateMode(mode.id, { description: e.target.value })}
                  rows={2}
                  placeholder="Ej: Pago único - 10% descuento"
                />
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
