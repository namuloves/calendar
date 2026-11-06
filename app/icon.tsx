import { ImageResponse } from 'next/og';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#F5F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 340, height: 340, background: '#fff', border: '12px solid #16191A', borderRadius: 60, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 90, background: '#16191A' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: '#3F4BD1' }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
