import { startTransition, useState, memo } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';
import Routes from './Routes/Routes';
import { Tab, Tabs } from 'react-bootstrap';
import Stations from './Stations/Stations';
import type { Route, Station, TransportType, SelectedRoute } from '@/types/transport';
import { getErrorMessage } from '@/utils/errors';
import { Spinner } from '@/components/Spinner';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useRouteSelection } from '@/hooks/useRouteSelection';

interface SidebarProps {
    routes: Route[];
    stations: Station[] | undefined;
    loading: boolean;
    error: Error | null;
    selectedRoutes: SelectedRoute[];
    onRoutesChange: (routes: Array<{ id: number; type: TransportType }>) => void;
    onStationSelect: (lat: number, lng: number, id: number, name: string) => void;
    onToggle?: (isOpen: boolean) => void;
}

function Sidebar({ routes, stations, loading, error, selectedRoutes, onRoutesChange, onStationSelect, onToggle }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('routes');
    const showLoading = useDelayedLoading(loading);

    const {
        activeTransportType,
        handleRouteToggle,
        handleSelectAllOfType,
    } = useRouteSelection({
        routes,
        selectedRoutes,
        onRoutesChange,
    });

    const handleStationSelect = (lat: number, lng: number, id: number, name: string) => {
        startTransition(() => {
            onStationSelect(lat, lng, id, name)
        });
    };

    const handleToggleSidebar = () => {
        const next = !isOpen;
        setIsOpen(next);
        // Call onToggle after state update to avoid render-time state updates
        onToggle?.(next);
    };

    return (
        <>
            <button
                className="sidebar-toggle-btn"
                onClick={handleToggleSidebar}
                aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
                type='button'
            >
                {isOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
            </button>

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                {showLoading && <Spinner size="md" text="Загрузка маршрутов..." />}
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
