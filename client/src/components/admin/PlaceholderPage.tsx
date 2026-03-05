interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">This page is under development</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
