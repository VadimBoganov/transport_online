import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';
import { useRoutes } from '@/hooks/useRotues';
import RouteItem from '../RouteItem/RouteItem';
import config, { type TransportType } from '@config';
import { Accordion } from 'react-bootstrap';

import * as IOIcons from "react-icons/io5";
import * as BIIcons from "react-icons/bi";
import * as MDIcons from "react-icons/ri";

interface SidebarProps {
    onRouteSelect: (routeId: number | null, routeType: TransportType | null) => void;
}

export default function Sidebar({ onRouteSelect }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
    const [_, setSelectedRouteType] = useState<TransportType | null>(null);

    const { data: routes, isLoading, error } = useRoutes();

    const handleRouteToggle = (id: number, type: TransportType) => {
        const newId = selectedRouteId === id ? null : id;
        const newType = newId ? type : null;

        setSelectedRouteId(newId);
        setSelectedRouteType(newType);
        onRouteSelect(newId, newType);
    };

    const RouteIcons: Record<TransportType, React.ReactNode> = {
        "А": <BIIcons.BiBus size={config.routeIconSize} />,
        "Т": <IOIcons.IoBus size={config.routeIconSize} />,
        "М": <MDIcons.RiBusFill size={config.routeIconSize} />
    };


    return (
        <>
            <button
                className="sidebar-toggle-btn"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
                type='button'
            >
                {isOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
            </button>

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <h2>Маршруты</h2>

                {isLoading && <p>Загрузка маршрутов...</p>}
                {error && <p className="error">Ошибка: {(error as Error).message}</p>}
                {routes && routes.length === 0 && <p>Маршруты не найдены</p>}

                <Accordion>
                    {config.routes.map((route, index) => {
                        const filteredRoutes = routes?.filter(item => item.type === route.type)
                            .filter((item, idx, self) =>
                                self.findIndex(a => a.num === item.num) === idx
                            ) || [];

                        return (
                            <Accordion.Item key={index} eventKey={index.toString()}>
                                <Accordion.Header>
                                    <div className="accordion-header__icon">{RouteIcons[route.type]}</div>
                                    {route.title}
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
                                                    onClick={() => handleRouteToggle(item.id, item.type as TransportType)}
                                                    checked={selectedRouteId === item.id}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </Accordion.Body>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            </div>
        </>
    );
}
