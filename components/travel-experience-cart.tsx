'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { TravelExperience, ExperienceCartItem } from '@/lib/types'

interface TravelExperienceCartProps {
  experience: TravelExperience
}

export default function TravelExperienceCart({ experience }: TravelExperienceCartProps) {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart } = useCartStore()
  const { toast } = useToast()

  const selectedPlan = experience.plans[selectedPlanIndex]
  const selectedPlanPriceARS = selectedPlan.price_ars_blue ?? Math.round(selectedPlan.price_usd * 1100)
  const isTrevelinExperience = experience.location.toLowerCase().includes('trevelin') || experience.title.toLowerCase().includes('trevelin')
  const canAddToCart = !isTrevelinExperience || selectedPlanPriceARS >= 500000

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

    setIsAdding(true)
    try {
      const cartItem: ExperienceCartItem = {
        type: 'experience',
        id: experience.id,
        name: experience.title,
        price_usd: selectedPlan.price_usd,
        price_ars_blue: selectedPlanPriceARS,
        quantity: 1,
        image_url: experience.image_url,
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
          {experience.plans.map((plan, index) => (
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
                  <div className="font-bold text-blue-600">USD {plan.price_usd.toFixed(2)}</div>
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
              {selectedPlan.includes.map((item, idx) => (
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
                {selectedPlan.excludes.map((item, idx) => (
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

      {/* Price Summary */}
      <div className="bg-foreground/5 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Precio por persona:</span>
          <span className="font-semibold">USD {selectedPlan.price_usd.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">En pesos (dólar blue):</span>
          <span className="font-semibold">$ {selectedPlan.price_ars_blue.toLocaleString('es-AR')}</span>
        </div>
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

