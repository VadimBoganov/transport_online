import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';
import './Sidebar.css';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className="sidebar-toggle-btn"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
                {isOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
            </button>

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <h2>Меню</h2>
                <p>Здесь может быть фильтр, настройки, навигация и т.д.</p>
                {/* Ваш контент */}
            </div>
        </>
    );
}
