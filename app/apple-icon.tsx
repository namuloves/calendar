import { ImageResponse } from 'next/og';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#F5F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 120, height: 120, background: '#fff', border: '5px solid #16191A', borderRadius: 22, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 32, background: '#16191A' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 25, height: 25, borderRadius: 13, background: '#3F4BD1' }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
