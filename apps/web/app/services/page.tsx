import Link from 'next/link';

const services = [
  {
    name: 'Student Scholarship Assistance',
    key: 'scholarship_assistance',
    description: 'Apply for service support using identity, enrollment, residency, income, and consent evidence.',
    badge: 'Priority support'
  }
];

export default function ServicesPage() {
  return (
    <main>
      <div className="section-header">
        <span className="kicker">Services</span>
        <h1>Find the right public service</h1>
      </div>

      <div className="grid">
        {services.map((service) => (
          <div key={service.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="badge">{service.badge}</span>
            <div>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
            </div>
            <Link href={`/apply/${service.key}/start`}>
              <button>Start application</button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
