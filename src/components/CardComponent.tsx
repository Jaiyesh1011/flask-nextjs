import React from 'react';

interface CardProps {
    card: {
        id: number;
        name: string;
        email: string;
    };
}

const CardComponent: React.FC<CardProps> = ({ card }) => {
    return (
        <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">{card.name}</h3>
            <p className="text-gray-600">{card.email}</p>
            <p className="text-sm text-gray-500">ID: {card.id}</p>
            {/* You can add more details here if needed */}
        </div>
    );
};

export default CardComponent;