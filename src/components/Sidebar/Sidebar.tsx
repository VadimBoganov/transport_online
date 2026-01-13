import { startTransition, useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';
import Routes from './Routes/Routes';
import { Tab, Tabs } from 'react-bootstrap';
import Stations from './Stations/Stations';
import type { Route, Station, TransportType } from '@/types/transport';

interface SidebarProps {
    routes: Route[];
    stations: Station[] | undefined;
    loading: boolean;
    error: Error | null;
    onRoutesChange: (routes: Array<{ id: number; type: TransportType }>) => void;
    onStationSelect: (lat: number, lng: number, id: number, name: string) => void;
}

export default function Sidebar({ routes, stations, loading, error, onRoutesChange, onStationSelect }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRoutes, setSelectedRoutes] = useState<Array<{ id: number; type: TransportType }>>([]);
    const [activeTransportType, setActiveTransportType] = useState<TransportType | null>(null);
    const [activeTab, setActiveTab] = useState('routes');

    const handleRouteToggle = (type: TransportType, num: string) => {
        const routesWithSameNum = routes.filter(r => r.num === num && r.type === type);

        const isAnySelected = selectedRoutes.some(sr =>
            routesWithSameNum.some(r => r.id === sr.id)
        );

        let updated: Array<{ id: number; type: TransportType }>;

        if (isAnySelected) {
            updated = selectedRoutes.filter(sr =>
                !routesWithSameNum.some(r => r.id === sr.id)
            );
        } else {
            updated = [
                ...selectedRoutes,
                ...routesWithSameNum.map(r => ({ id: r.id, type: r.type as TransportType }))
            ];
        }

        setSelectedRoutes(updated);
        onRoutesChange(updated);

        if (activeTransportType) {
            setActiveTransportType(null);
        }
    };

    const handleSelectAllOfType = (type: TransportType) => {
        if (activeTransportType === type) {
            const remainingRoutes = selectedRoutes.filter(sr => sr.type !== type);
            setSelectedRoutes(remainingRoutes);
            onRoutesChange(remainingRoutes);
            setActiveTransportType(null);
            return;
        }

        const typeRoutes = routes.filter(r => r.type === type);
        const newSelected = typeRoutes.map(r => ({ id: r.id, type: r.type as TransportType }));

        setSelectedRoutes(newSelected);
        onRoutesChange(newSelected);
        setActiveTransportType(type);
    };

    const handleStationSelect = (lat: number, lng: number, id: number, name: string) => {
        startTransition(() => {
            onStationSelect(lat, lng, id, name)
        });
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
                                        onSelectAllOfType={handleSelectAllOfType}
                                        activeTransportType={activeTransportType}
                                    />
                                )}
                            </div>
                        </Tab>

                        <Tab eventKey="stops" title="Остановки">
                            {activeTab === 'stops' && (
                                <div className="tab-content-area">
                                    <Stations stations={stations} onStationSelect={handleStationSelect} />
                                </div>
                            )}
                        </Tab>
                    </Tabs>
                )}
            </div>
        </>
    );
}
