import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ModernHome.css';

const ModernHome = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    documentsProcessed: 0,
    consultations: 0,
    successRate: 0,
  });

  useEffect(() => {
    // Fetch services from API
    fetch('http://127.0.0.1:5000/api/services')
      .then((res) => res.json())
      .then((data) => {
        // Check if data is an array (success) or error object
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          // Database unavailable - use default services
          console.warn('Services API returned error, using defaults:', data);
          setServices([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load services:', err);
        setServices([]);
        setLoading(false);
      });

    // Animate stats
    animateStats();
  }, []);

  const animateStats = () => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setStats({
        documentsProcessed: Math.floor(5000 * progress),
        consultations: Math.floor(10000 * progress),
        successRate: Math.floor(98 * progress),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
          <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
        </svg>
      ),
      title: 'AI-Powered Analysis',
      description: 'Advanced GPT-4o-mini with legal specialization for accurate document analysis',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor" />
        </svg>
      ),
      title: 'Knowledge Base',
      description: 'RAG system with Indian legal documents for context-aware responses',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2V13H10V22L17 10H13L17 2H7Z" fill="currentColor" />
        </svg>
      ),
      title: 'Real-Time Processing',
      description: 'Streaming responses and instant document generation',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="currentColor" />
        </svg>
      ),
      title: 'Secure & Private',
      description: 'Enterprise-grade security with PostgreSQL database',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Corporate Lawyer',
      text: 'This AI assistant has revolutionized how we handle contract reviews. Saves hours every day!',
      rating: 5,
    },
    {
      name: 'Priya Sharma',
      role: 'Legal Consultant',
      text: 'Incredible accuracy in legal document generation. The RAG system provides perfect citations.',
      rating: 5,
    },
    {
      name: 'Amit Patel',
      role: 'Startup Founder',
      text: 'As a non-lawyer, this tool helps me understand complex legal documents with ease.',
      rating: 5,
    },
  ];

  return (
    <div className="modern-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor" />
            </svg>
            <span>Powered by GPT-4o-mini & Legal BGE-M3</span>
          </div>
          <h1 className="hero-title">
            Your AI-Powered
            <span className="gradient-text"> Legal Assistant</span>
          </h1>
          <p className="hero-subtitle">
            Revolutionary legal documentation platform powered by advanced AI.
            Generate contracts, analyze documents, and get expert legal guidance instantly.
          </p>
          <div className="hero-actions">
            <Link to="/workspace" className="btn-primary">
              <span>Get Started</span>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <button className="btn-secondary" onClick={() => {
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <span>Explore Services</span>
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">{stats.documentsProcessed.toLocaleString()}+</div>
              <div className="stat-label">Documents Processed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.consultations.toLocaleString()}+</div>
              <div className="stat-label">Legal Consultations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.successRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="float-card card-1">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
              </svg>
            </div>
            <div className="card-text">Legal Analysis</div>
          </div>
          <div className="float-card card-2">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" />
              </svg>
            </div>
            <div className="card-text">Document Generation</div>
          </div>
          <div className="float-card card-3">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14Z" fill="currentColor" />
              </svg>
            </div>
            <div className="card-text">Contract Review</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Our Platform?</h2>
          <p>Cutting-edge AI technology meets legal expertise</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="section-header">
          <h2>Our Legal Services</h2>
          <p>Comprehensive AI-powered legal solutions</p>
        </div>
        
        {loading ? (
          <div className="services-loading">
            <div className="loading-spinner"></div>
            <p>Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="services-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" />
              </svg>
            </div>
            <h3>Services Temporarily Unavailable</h3>
            <p>Please check back later or contact support.</p>
            <Link to="/templates" className="btn-primary">
              Try Template Upload Instead →
            </Link>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={service.id} className="service-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="service-image">
                  <img src={service.image} alt={service.title} />
                  <div className="service-overlay">
                    <Link to="/workspace" className="service-btn">
                      Get Started →
                    </Link>
                  </div>
                </div>
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="service-tags">
                    {service.tags?.map((tag, idx) => (
                      <span key={idx} className="service-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2>What Our Clients Say</h2>
          <p>Trusted by legal professionals across India</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor" />
                  </svg>
                ))}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Legal Workflow?</h2>
          <p>Join thousands of legal professionals using AI to work smarter, not harder.</p>
          <div className="cta-actions">
            <Link to="/workspace" className="btn-primary large">
              <span>Start Free Trial</span>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/about" className="btn-secondary large">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ModernHome;
