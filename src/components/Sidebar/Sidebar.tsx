import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';
import { useRoutes } from '@/hooks/useRotues';
import RouteItem from '../RouteItem/RouteItem';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: routes, isLoading, error } = useRoutes();

    const handleRouteToggle = () => {
        console.log('Переключить маршрут:');
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
                
                <div className="routes-list">
                    {routes?.map((route) => (
                        <RouteItem
                            key={route.id}
                            {...route}
                            onClick={() => handleRouteToggle()}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
