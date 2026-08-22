import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowRight, faArrowLeft, } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';
import {
    Smartphone, Laptop, MonitorSmartphone, Armchair, Coffee, Sparkles, Shirt, Gem, Car,
    ChevronLeft, ChevronDown, ChevronUp, LayoutGrid
}
    from 'lucide-react';
import "./Catagoryes.css"
import { useNavigate } from 'react-router-dom';


library.add(faArrowRight, faArrowLeft,);
// ==========================================
// ۲. داده‌های نمونه (Mock Data)
// ==========================================
const CATEGORIES = [
    { id: 'mobile', title: 'موبایل', icon: Smartphone },
    { id: 'laptop', title: 'لپ تاپ', icon: Laptop },
    { id: 'digital', title: 'کالای دیجیتال', icon: MonitorSmartphone },
    { id: 'home', title: 'خانه و آشپزخانه', icon: Armchair },
    { id: 'appliances', title: 'لوازم خانگی برقی', icon: Coffee },
    { id: 'beauty', title: 'آرایشی بهداشتی', icon: Sparkles },
    { id: 'fashion', title: 'مد و پوشاک', icon: Shirt },
    { id: 'jewelry', title: 'طلا و نقره', icon: Gem },
    { id: 'car', title: 'خودرو و موتورسیکلت', icon: Car },
];

const SUB_CATEGORIES_DATA = {
    mobile: {
        headerLink: 'همه محصولات موبایل',
        mainTitle: 'انتخاب موبایل',
        sections: [
            {
                id: 'apple',
                title: 'گوشی های اپل',
                defaultOpen: true,
                items: [
                    { id: 'all', title: 'همه کالاها', isIcon: true, icon: LayoutGrid },
                    { id: 'ip17', title: 'آیفون ۱۷', image: 'https://placehold.co/150x150/e8e8e8/333?text=iPhone+17' },
                    { id: 'ip16', title: 'آیفون ۱۶', image: 'https://placehold.co/150x150/e8e8e8/333?text=iPhone+16' }
                ]
            },
            { id: 'brands', title: 'برندهای مختلف گوشی موبایل', items: [] },
            { id: 'top-brands', title: 'برندهای برتر', items: [] },
            { id: 'price', title: 'گوشی براساس قیمت', items: [] },
            { id: 'performance', title: 'گوشی براساس عملکرد', items: [] },
        ]
    }
};

// ==========================================
// ۳. کامپوننت‌های مستقل React
// ==========================================

const ProductCircle = ({ item }) => {
    return (
        <div className="product-item">
            <div className="product-circle">
                {item.isIcon ? (
                    <item.icon size={32} className="product-icon" />
                ) : (
                    <img src={item.image} alt={item.title} />
                )}
            </div>
            <span className="product-title">{item.title}</span>
        </div>
    );
};

const Accordion = ({ section }) => {
    const [isOpen, setIsOpen] = useState(section.defaultOpen || false);

    return (
        <div className="accordion">
            <button className="accordion-btn" onClick={() => setIsOpen(!isOpen)}>
                <span>{section.title}</span>
                {isOpen ? (
                    <ChevronUp size={20} className="accordion-icon" />
                ) : (
                    <ChevronDown size={20} className="accordion-icon" />
                )}
            </button>

            {isOpen && section.items && section.items.length > 0 && (
                <div className="accordion-content no-scrollbar">
                    {section.items.map(item => (
                        <ProductCircle key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

const MainContent = ({ categoryId }) => {
    const data = SUB_CATEGORIES_DATA[categoryId];

    if (!data) {
        return (
            <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                محتوایی برای این دسته‌بندی یافت نشد.
            </div>
        );
    }

    return (
        <div className="main-content no-scrollbar">
            <div className="header-link">
                <ChevronLeft size={20} />
                <span>{data.headerLink}</span>
            </div>

            <h2 className="main-title">{data.mainTitle}</h2>

            <div>
                {data.sections.map(section => (
                    <Accordion key={section.id} section={section} />
                ))}
            </div>
        </div>
    );
};


const Sidebar = ({ activeId, onSelect }) => {
    return (
        <div className="sidebar no-scrollbar">
            {CATEGORIES.map(category => {
                const isActive = activeId === category.id;
                const Icon = category.icon;

                return (
                    <button
                        key={category.id}
                        onClick={() => onSelect(category.id)}
                        className={`sidebar-btn ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={24} className="sidebar-btn-icon" strokeWidth={isActive ? 2 : 1.5} />
                        <span>{category.title}</span>
                    </button>
                );
            })}
        </div>
    );
};
export default function Catagoryes() {
    const [activeCategory, setActiveCategory] = useState('mobile');
    const navigate = useNavigate()

    return (
        <>
           
            <div className="app-wrapper">
                 <h1 title='بازگشت به خانه' className='BackFromCatagory' onClick={() => { navigate("/") }}><FontAwesomeIcon icon={faArrowRight} /></h1>
                {/* در پروژه شخصی خودتان نیازی به این تگ style نیست. 
        فقط کافیست کدهای متغیر styles بالا را در فایل App.css قرار دهید. 
      */}


                <Sidebar activeId={activeCategory} onSelect={setActiveCategory} />
                <MainContent categoryId={activeCategory} />

            </div>
        </>
    );
}