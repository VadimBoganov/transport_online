import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';
import type { Route } from '@/hooks/useRoutes';
import type { TransportType } from '@config';
import Routes from './Routes/Routes';
import { Tab, Tabs } from 'react-bootstrap';
import Stations from './Stations/Stations';

interface SidebarProps {
    routes: Route[];
    loading: boolean;
    error: Error | null;
    onRoutesChange: (routes: Array<{ id: number; type: TransportType }>) => void;
}

export default function Sidebar({ routes, loading, error, onRoutesChange }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRoutes, setSelectedRoutes] = useState<Array<{ id: number; type: TransportType }>>([]);
    const [activeTab, setActiveTab] = useState('routes');

    const handleRouteToggle = (id: number, type: TransportType) => {
        const updated = selectedRoutes.find(r => r.id === id)
            ? selectedRoutes.filter(r => r.id !== id)
            : [...selectedRoutes, { id, type }];

        setSelectedRoutes(updated);
        onRoutesChange(updated);
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
                {loading && <p>Загрузка маршрутов...</p>}
                {error && <p className="error">Ошибка: {error.message}</p>}
                {routes.length === 0 && !loading && <p>Маршруты не найдены</p>}

                {!loading && !error && (
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k || 'routes')}
                        id="sidebar-tabs"
                        className="mb-3"
                    >
                        <Tab eventKey="routes" title="Маршруты">
                            <div className="tab-content-area">
                                {routes.length === 0 ? (
                                    <p>Маршруты не найдены</p>
                                ) : (
                                    <Routes
                                        routes={routes}
                                        selectedRoutes={selectedRoutes}
                                        onRouteToggle={handleRouteToggle}
                                    />
                                )}
                            </div>
                        </Tab>

                        <Tab eventKey="stops" title="Остановки">
                            <div className="tab-content-area">
                                <Stations />
                            </div>
                        </Tab>
                    </Tabs>
                )}
            </div>
        </>
    );
}
