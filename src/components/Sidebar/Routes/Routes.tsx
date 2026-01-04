import { Accordion } from 'react-bootstrap';
import RouteItem from '@components/RouteItem/RouteItem';
import config, { type TransportType } from '@config';
import type { Route } from '@/hooks/useRoutes';
import './Routes.css';

import * as IOIcons from "react-icons/io5";
import * as BIIcons from "react-icons/bi";
import * as MDIcons from "react-icons/ri";

interface RoutesListProps {
    routes: Route[];
    selectedRoutes: Array<{ id: number; type: TransportType }>;
    onRouteToggle: (id: number, type: TransportType) => void;
}

const RouteIcons: Record<TransportType, React.ReactNode> = {
    "А": <BIIcons.BiBus size={config.routeIconSize} />,
    "Т": <IOIcons.IoBus size={config.routeIconSize} />,
    "М": <MDIcons.RiBusFill size={config.routeIconSize} />
};

export default function Routes({ routes, selectedRoutes, onRouteToggle }: RoutesListProps) {
    return (
        <Accordion>
            {config.routes.map((routeConfig, index) => {
                const filteredRoutes = routes
                    .filter(item => item.type === routeConfig.type)
                    .filter((item, idx, self) =>
                        self.findIndex(a => a.num === item.num) === idx
                    );

                return (
                    <Accordion.Item key={index} eventKey={index.toString()}>
                        <Accordion.Header>
                            <div className="accordion-header__icon">{RouteIcons[routeConfig.type]}</div>
                            {routeConfig.title}
                        </Accordion.Header>
                        <Accordion.Body>
                            {filteredRoutes.length === 0 ? (
                                <p className="text-muted">Нет маршрутов</p>
                            ) : (
                                <div className="routes-grid">
                                    {filteredRoutes.map((item) => (
                                        <RouteItem
                                            key={item.id}
                                            {...item}
                                            onClick={() => onRouteToggle(item.id, item.type as TransportType)}
                                            checked={!!selectedRoutes.find(r => r.id === item.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                );
            })}
        </Accordion>
    );
}
