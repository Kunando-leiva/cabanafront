import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { API_URL } from '../config';

function StatsCard({ title, value, link, imageId }) {
  const imageUrl = imageId ? `${API_URL}/api/images/${imageId}` : null;

  return (
    <Link to={link} className="block text-decoration-none">
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow h-full">
        <div className="w-full h-32 bg-gray-100 mb-3 rounded overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${API_URL}/default-cabana.jpg`;
                e.target.className = 'w-full h-full object-contain';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-500">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <p className="text-2xl font-bold mt-1 text-primary">{value}</p>
        </div>
      </div>
    </Link>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  link: PropTypes.string.isRequired,
  imageId: PropTypes.string // Ahora recibe el ID en lugar de la URL completa
};

export default StatsCard;