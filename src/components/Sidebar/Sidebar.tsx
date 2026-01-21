import { startTransition, useState, memo } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';
import Routes from './Routes/Routes';
import { Tab, Tabs } from 'react-bootstrap';
import Stations from './Stations/Stations';
import type { Route, Station, TransportType, SelectedRoute } from '@/types/transport';
import { getErrorMessage } from '@/utils/errors';
import { Spinner } from '@/components/Spinner';

interface SidebarProps {
    routes: Route[];
    stations: Station[] | undefined;
    loading: boolean;
    error: Error | null;
    selectedRoutes: SelectedRoute[];
    onRoutesChange: (routes: Array<{ id: number; type: TransportType }>) => void;
    onStationSelect: (lat: number, lng: number, id: number, name: string) => void;
}

function Sidebar({ routes, stations, loading, error, selectedRoutes, onRoutesChange, onStationSelect }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
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

        onRoutesChange(updated);

        if (activeTransportType) {
            setActiveTransportType(null);
        }
    };

    const handleSelectAllOfType = (type: TransportType) => {
        if (activeTransportType === type) {
            const remainingRoutes = selectedRoutes.filter(sr => sr.type !== type);
            onRoutesChange(remainingRoutes);
            setActiveTransportType(null);
            return;
        }

        const typeRoutes = routes.filter(r => r.type === type);
        const newSelected = typeRoutes.map(r => ({ id: r.id, type: r.type as TransportType }));

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
                {loading && <Spinner size="md" text="Загрузка маршрутов..." />}
                {error && <p className="error">Ошибка: {getErrorMessage(error)}</p>}
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

export default memo(Sidebar);
