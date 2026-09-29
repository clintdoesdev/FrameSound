import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'linear-gradient(135deg, #5e5ce6 0%, #bf5af2 55%, #ff375f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ width: 13, height: 13, borderRadius: 3, background: 'rgba(255,255,255,0.92)' }} />
    </div>
  )
}
