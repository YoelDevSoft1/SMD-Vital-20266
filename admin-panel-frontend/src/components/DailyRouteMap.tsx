import L from 'leaflet';
import { formatTime } from '@/utils/dateFormat';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { DoctorRouteResponse } from '@/types';

interface DailyRouteMapProps {
  route?: DoctorRouteResponse;
}

export default function DailyRouteMap({ route }: DailyRouteMapProps) {
  const stops = route?.stops?.filter((stop) => stop.coordinates) ?? [];
  const positions = stops.map((stop) => [stop.coordinates!.lat, stop.coordinates!.lng] as [number, number]);
  const center = positions[0] ?? ([4.711, -74.0721] as [number, number]);

  return (
    <div className="relative z-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <MapContainer center={center} zoom={positions.length ? 12 : 11} className="relative z-0 h-80 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: '#2563eb', weight: 4 }} />}
        {stops.map((stop) => (
          <Marker
            key={stop.appointment.id}
            position={[stop.coordinates!.lat, stop.coordinates!.lng]}
            icon={createNumberedMarkerIcon(stop.order)}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <strong>#{stop.order} {stop.appointment.patient?.user?.firstName} {stop.appointment.patient?.user?.lastName}</strong>
                <div>{formatTime(stop.appointment.scheduledAt)}</div>
                <div>{stop.appointment.address}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function createNumberedMarkerIcon(order: number) {
  const isFirst = order === 1;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${isFirst ? '#059669' : '#2563eb'};
        border: 3px solid #ffffff;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.35);
        color: #ffffff;
        font-size: 14px;
        font-weight: 800;
        line-height: 1;
      ">${order}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}
