import type { Route } from "@/hooks/useRoutes";
import './RouteItem.css'

interface RouteItemProps extends Route {
  onClick: () => void;
  checked: boolean;
}

export default function RouteItem({ id, num, onClick, checked }: RouteItemProps) {
    return (
        <div className="route-item">
            <input
                type="checkbox"
                id={id.toString()}
                checked={checked}
                onChange={onClick}
            />
            <label htmlFor={id.toString()}>
                {num}
            </label>
        </div>
    );
}