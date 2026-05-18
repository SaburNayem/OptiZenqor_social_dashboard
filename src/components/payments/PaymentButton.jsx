import { useState } from 'react'
import { API_BASE_URL } from '../../services/apiClient'

export function PaymentButton({
  accessToken,
  itemType = 'premium_plan',
  itemId = 'monthly',
  title = 'Premium monthly plan',
  amount = 499,
  currency = 'BDT',
  region = 'local',
  customer,
  metadata = {},
  children = 'Pay now',
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const createPayment = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          itemType,
          itemId,
          title,
          amount,
          currency,
          region,
          customer,
          metadata,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Unable to start payment.')
      }

      const checkoutUrl = payload.data?.checkoutUrl
      if (!checkoutUrl) {
        throw new Error('Payment checkout URL missing.')
      }
      window.location.assign(checkoutUrl)
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Payment failed to start.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="payment-action">
      <button type="button" onClick={() => void createPayment()} disabled={isLoading || !accessToken}>
        {isLoading ? 'Starting checkout...' : children}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )
}
