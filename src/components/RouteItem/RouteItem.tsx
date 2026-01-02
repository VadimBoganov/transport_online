import type { Route } from "@/hooks/useRotues";
import './RouteItem.css'

interface RouteItemProps extends Route {
  onClick: () => void;
}

export default function RouteItem({ id, num, onClick }: RouteItemProps) {
    return (
    <div className="route-item">
      <input
        type="checkbox"
        id={id.toString()}
        onChange={onClick}
      />
      <label htmlFor={id.toString()}>
        [{num}]
      </label>
    </div>
  );
}