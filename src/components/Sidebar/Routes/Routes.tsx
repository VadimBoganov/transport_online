import { Accordion, Form } from 'react-bootstrap';
import config from '@config';
import './Routes.css';

import { BiBus } from 'react-icons/bi';
import { IoBus } from 'react-icons/io5';
import { RiBusFill } from 'react-icons/ri';
import type { Route, TransportType } from '@/types/transport';
import { useMemo } from 'react';
import React from 'react';
import RouteItem from '../RouteItem/RouteItem';
import { groupRoutesByType } from '@/services/routeService';

interface RoutesListProps {
    routes: Route[];
    selectedRoutes: Array<{ id: number; type: TransportType }>;
    onRouteToggle: (type: TransportType, num: string) => void;
    onSelectAllOfType: (type: TransportType) => void;
    activeTransportType: TransportType | null;
}

const RouteIcons: Record<TransportType, React.ReactNode> = {
    "А": <BiBus size={config.routeIconSize} />,
    "Т": <IoBus size={config.routeIconSize} />,
    "М": <RiBusFill size={config.routeIconSize} />
};

function Routes({ routes, selectedRoutes, onRouteToggle, activeTransportType, onSelectAllOfType }: RoutesListProps) {
    const groupedRoutes = useMemo(() => groupRoutesByType(routes), [routes]);

    return (
         <Accordion>
        {groupedRoutes.map((group, index) => {
            const isTypeActive = activeTransportType === group.type;

            return (
                <Accordion.Item key={group.type} eventKey={index.toString()}>
                    <Accordion.Header>
                        <div className="accordion-header__icon">{RouteIcons[group.type as TransportType]}</div>
                        <Form.Check
                            type="checkbox"
                            checked={isTypeActive}
                            onChange={() => onSelectAllOfType(group.type as TransportType)}
                            onClick={(e) => e.stopPropagation()}
                            className="me-3"
                        />
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
            );
        })}
    </Accordion>
    );
}

export default React.memo(Routes)