

const BenefitsSection = () => {
    const benefits = [
        {
            icon: "fa-solid fa-truck-fast",
            title: "Free shipping",
            description: "On orders over 99.000d"
        },
        {
            icon: "fa-solid fa-arrow-right-arrow-left",
            title: "Easy returns",
            description: "30-day money back guarantee"
        },
        {
            icon: "fa-solid fa-shield-heart",
            title: "Authentic books",
            description: "Trusted quality from publishers"
        },
        {
            icon: "fa-solid fa-credit-card",
            title: "Multiple payment",
            description: "Card, e-wallet and COD"
        }
    ];

    return (
        <section className="benefits-section">
            <div className="benefits-grid">
                {benefits.map((benefit) => (
                    <article key={benefit.title} className="benefit-item">
                        <span className="benefit-icon" aria-hidden="true">
                            <i className={benefit.icon}></i>
                        </span>
                        <div>
                            <h5>{benefit.title}</h5>
                            <p>{benefit.description}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default BenefitsSection;