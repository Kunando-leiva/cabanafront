import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

function StatsCard({ title, value, link }) {
  return (
    <Link to={link} className="block">
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow h-full">
        <div className="flex flex-col">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
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
  link: PropTypes.string.isRequired
};

export default StatsCard;