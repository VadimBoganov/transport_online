import { Accordion } from 'react-bootstrap';
import config, { type TransportType } from '@config';
import './Routes.css';

import * as IOIcons from "react-icons/io5";
import * as BIIcons from "react-icons/bi";
import * as MDIcons from "react-icons/ri";
import RouteItem from '../RouteItem/RouteItem';
import type { Route } from '@/types/transport';
import { useMemo } from 'react';
import React from 'react';

interface RoutesListProps {
    routes: Route[];
    selectedRoutes: Array<{ id: number; type: TransportType }>;
    onRouteToggle: (type: TransportType, num: string) => void;
}

const RouteIcons: Record<TransportType, React.ReactNode> = {
    "А": <BIIcons.BiBus size={config.routeIconSize} />,
    "Т": <IOIcons.IoBus size={config.routeIconSize} />,
    "М": <MDIcons.RiBusFill size={config.routeIconSize} />
};

function Routes({ routes, selectedRoutes, onRouteToggle }: RoutesListProps) {
    const groupedRoutes = useMemo(() => {
        const map = new Map<string, Route[]>();

        routes.forEach(route => {
            const key = `${route.num}-${route.type}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(route);
        });

        return config.routes.map(rtConfig => ({
            type: rtConfig.type,
            title: rtConfig.title,
            routes: Array.from(map.values()).filter(r => r[0].type === rtConfig.type)
        }));
    }, [routes]);

    return (
        <Accordion>
            {groupedRoutes.map((group, index) => (
                <Accordion.Item key={group.type} eventKey={index.toString()}>
                    <Accordion.Header>
                        <div className="accordion-header__icon">{RouteIcons[group.type]}</div>
                        {group.title}
                    </Accordion.Header>
                    <Accordion.Body>
                        {group.routes.length === 0 ? (
                            <p className="text-muted">Нет маршрутов</p>
                        ) : (
                            <div className="routes-grid">
                                {group.routes.map((routeGroup) => (
                                    <RouteItem
                                        key={routeGroup[0].id}
                                        {...routeGroup[0]}
                                        onClick={() => onRouteToggle(routeGroup[0].type, routeGroup[0].num)}
                                        checked={!!selectedRoutes.find(r => r.id === routeGroup[0].id)}
                                    />
                                ))}
                            </div>
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            ))}
        </Accordion>
    );
}

export default React.memo(Routes)