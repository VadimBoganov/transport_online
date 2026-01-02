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

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: routes, isLoading, error } = useRoutes();

    const handleRouteToggle = () => {
        console.log('Переключить маршрут:');
    };

    // Внутри Sidebar.tsx
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
                                                    onClick={() => handleRouteToggle()}
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
