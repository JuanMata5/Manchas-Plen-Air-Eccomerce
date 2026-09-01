'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { getOptionGroupModifier } from '@/lib/travel-admin'
import type { TravelExperience, ExperienceCartItem, TravelOptionGroup, TravelPaymentMode } from '@/lib/types'

interface TravelExperienceCartProps {
  experience: TravelExperience
}

export default function TravelExperienceCart({ experience }: TravelExperienceCartProps) {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<{
    [groupId: string]: string | string[]
  }>({})
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('')
  const [selectedInstallments, setSelectedInstallments] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart } = useCartStore()
  const { toast } = useToast()

  const selectedPlan = Array.isArray(experience.plans) && experience.plans[selectedPlanIndex]
    ? experience.plans[selectedPlanIndex]
    : { id: '0', name: '', price_usd: 0, price_ars_blue: 0, includes: [], excludes: [], description: '' }

  const selectedPlanPriceARS = selectedPlan.price_ars_blue ?? Math.round(selectedPlan.price_usd * 1100)
  const reservationPriceARS = selectedPlan.precio_reserva_ars ?? experience.price_reservation ?? null
  const balanceDueARS = reservationPriceARS ? Math.max(0, selectedPlanPriceARS - reservationPriceARS) : 0

  const isTrevelinExperience = experience.location.toLowerCase().includes('trevelin') || experience.title.toLowerCase().includes('trevelin')
  const canAddToCart =
    !isTrevelinExperience ||
    selectedPlanPriceARS >= 500000 ||
    (reservationPriceARS !== null && reservationPriceARS > 0)

  // Calcular modificadores de precio por opciones
  const calculateOptionsModifier = () => {
    let modifier = 0
    if (experience.optionGroups) {
      for (const group of experience.optionGroups) {
        const selectedValue = selectedOptions[group.id]
        if (!selectedValue) continue
        modifier += getOptionGroupModifier(group, selectedValue, selectedPlanPriceARS)
      }
    }
    return modifier
  }

  // Calcular modificador de pago
  const calculatePaymentModifier = () => {
    if (!selectedPaymentMode || !experience.paymentModes) return 0
    const mode = experience.paymentModes.find((m) => m.id === selectedPaymentMode)
    return mode?.priceModifier || 0
  }

  const optionsModifier = calculateOptionsModifier()
  const paymentModifier = calculatePaymentModifier()
  const totalModifier = optionsModifier + paymentModifier
  const finalPriceARS = selectedPlanPriceARS + totalModifier

  const handleAddToCart = async () => {
    if (!selectedPlan) return

    if (!canAddToCart) {
      toast({
        title: 'Reserva Trevelin no permitida',
        description: 'Los viajes a Trevelin solo se pueden reservar a partir de $500.000 ARS.',
        variant: 'destructive',
      })
      return
    }

    // Validar opciones requeridas
    if (experience.optionGroups) {
      for (const group of experience.optionGroups) {
        if (group.isRequired && !selectedOptions[group.id]) {
          toast({
            title: 'Opción requerida',
            description: `Debes seleccionar una opción de ${group.name}`,
            variant: 'destructive',
          })
          return
        }
      }
    }

    setIsAdding(true)
    try {
      const cartItem: ExperienceCartItem = {
        type: 'experience',
        id: experience.id,
        name: experience.title,
        price_usd: selectedPlan.price_usd,
        price_ars_blue: finalPriceARS,
        price_reservation_ars: reservationPriceARS,
        quantity: 1,
        image_url: experience.image_url,
        selectedOptions,
        selectedPaymentMode,
        selectedInstallments: selectedInstallments ?? undefined,
        metadata: {
          experienceId: experience.id,
          planIndex: selectedPlanIndex,
          planName: selectedPlan.name,
          location: experience.location,
          dates: experience.dates,
        },
      }

      addToCart(cartItem)

      toast({
        title: 'Experiencia agregada al carrito',
        description: `${experience.title} - Plan ${selectedPlan.name}`,
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: 'Error',
        description: 'No se pudo agregar la experiencia al carrito',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6 border-t pt-6">
      {/* Plan Selector */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Elige tu plan</h3>
        <div className="space-y-2">
          {Array.isArray(experience.plans) && experience.plans.map((plan, index) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanIndex(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedPlanIndex === index
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-border hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{plan.name}</h4>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  {plan.price_usd > 0 && (
                    <div className="font-bold text-blue-600">USD {plan.price_usd.toFixed(2)}</div>
                  )}
                  <div className="text-sm text-muted-foreground">$ {plan.price_ars_blue.toLocaleString('es-AR')}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div>
            <h4 className="font-semibold mb-2">Incluye:</h4>
            <ul className="space-y-1">
              {selectedPlan.includes && selectedPlan.includes.map((item, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {selectedPlan.excludes && selectedPlan.excludes.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">No incluye:</h4>
              <ul className="space-y-1">
                {selectedPlan.excludes && selectedPlan.excludes.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-gray-400">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Option Groups */}
      {experience.optionGroups && experience.optionGroups.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-semibold text-lg">Opciones personalizadas</h3>
          {experience.optionGroups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {group.name}
                  {group.isRequired && <span className="text-red-500">*</span>}
                </h4>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}

                <div className="space-y-2">
                  {group.type === 'radio' && (
                    <div className="space-y-2">
                      {group.options.map((option) => (
                        <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`option-${group.id}`}
                            checked={selectedOptions[group.id] === option.id}
                            onChange={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [group.id]: option.id,
                              }))
                            }
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{option.name}</span>
                            {option.priceModifier !== 0 && (
                              <span className="text-xs text-blue-600 ml-2">
                                {group.category === 'discount'
                                  ? `${option.priceModifier > 0 ? '+' : ''}${option.priceModifier}%`
                                  : `${option.priceModifier > 0 ? '+' : ''}$${option.priceModifier.toLocaleString('es-AR')}`}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {group.type === 'checkbox' && (
                    <div className="space-y-2">
                      {group.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`checkbox-${option.id}`}
                            checked={
                              Array.isArray(selectedOptions[group.id])
                                ? (selectedOptions[group.id] as string[]).includes(option.id)
                                : false
                            }
                            onCheckedChange={(checked) => {
                              const current = Array.isArray(selectedOptions[group.id])
                                ? (selectedOptions[group.id] as string[])
                                : []
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [group.id]: checked
                                  ? [...current, option.id]
                                  : current.filter((id) => id !== option.id),
                              }))
                            }}
                          />
                          <label
                            htmlFor={`checkbox-${option.id}`}
                            className="flex-1 cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-sm font-medium">{option.name}</span>
                            {option.priceModifier !== 0 && (
                              <span className="text-xs text-blue-600">
                                {group.category === 'discount'
                                  ? `${option.priceModifier > 0 ? '+' : ''}${option.priceModifier}%`
                                  : `${option.priceModifier > 0 ? '+' : ''}$${option.priceModifier.toLocaleString('es-AR')}`}
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {group.type === 'select' && (
                    <Select
                      value={(selectedOptions[group.id] as string) || ''}
                      onValueChange={(value) =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [group.id]: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {group.options.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                            {option.priceModifier !== 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {group.category === 'discount'
                                  ? `${option.priceModifier > 0 ? '+' : ''}${option.priceModifier}%`
                                  : `${option.priceModifier > 0 ? '+' : ''}$${option.priceModifier}`}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Modes */}
      {experience.paymentModes && experience.paymentModes.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-semibold text-lg">Modalidad de pago</h3>
          <div className="space-y-2">
            {experience.paymentModes.map((mode) => (
              <label key={mode.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment-mode"
                  checked={selectedPaymentMode === mode.id}
                  onChange={() => {
                    setSelectedPaymentMode(mode.id)
                    setSelectedInstallments(mode.installments || null)
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">{mode.name}</span>
                  {mode.description && (
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  )}
                  {mode.priceModifier !== 0 && (
                    <span className="text-xs text-blue-600">
                      {mode.priceModifier > 0 ? '+' : ''}${mode.priceModifier.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-foreground/5 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Precio base:</span>
          <span className="font-semibold">$ {selectedPlanPriceARS.toLocaleString('es-AR')}</span>
        </div>

        {optionsModifier !== 0 && (
          <div className="flex justify-between items-center text-blue-600">
            <span className="text-sm">Opciones seleccionadas:</span>
            <span className="font-semibold">
              {optionsModifier > 0 ? '+' : ''}${optionsModifier.toLocaleString('es-AR')}
            </span>
          </div>
        )}

        {paymentModifier !== 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span className="text-sm">Modificador de pago:</span>
            <span className="font-semibold">
              {paymentModifier > 0 ? '+' : ''}${paymentModifier.toLocaleString('es-AR')}
            </span>
          </div>
        )}

        {totalModifier !== 0 && (
          <div className="border-t pt-2 flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span className="text-lg">$ {finalPriceARS.toLocaleString('es-AR')}</span>
          </div>
        )}

        {reservationPriceARS && reservationPriceARS < finalPriceARS && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reserva:</span>
              <span className="font-semibold">$ {reservationPriceARS.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Saldo pendiente:</span>
              <span className="font-semibold">
                $ {Math.max(0, finalPriceARS - reservationPriceARS).toLocaleString('es-AR')}
              </span>
            </div>
          </>
        )}
      </div>

      {isTrevelinExperience && selectedPlanPriceARS < 500000 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Los viajes a Trevelin deben reservarse desde $500.000 ARS. Elige otro plan para continuar.
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={isAdding || !canAddToCart}
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isAdding ? 'Agregando...' : canAddToCart ? 'Agregar al carrito' : 'Plan no disponible'}
      </Button>

      <Badge variant="outline" className="w-full text-center justify-center">
        {experience.capacity} cupos disponibles
      </Badge>
    </div>
  )
}

