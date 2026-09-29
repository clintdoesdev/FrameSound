import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ width: 13, height: 13, borderRadius: 3, background: 'rgba(0,0,0,0.82)' }} />
    </div>
  )
}
