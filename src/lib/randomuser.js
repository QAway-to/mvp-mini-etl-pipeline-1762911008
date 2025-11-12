const DEFAULT_API_URL = 'https://randomuser.me/api/?results=500';

function fallbackUsers() {
    const users = [];
    const names = ['John', 'Jane', 'Peter', 'Alice', 'Bob', 'Eve', 'Mike', 'Sarah', 'Chris', 'Laura'];
    const surnames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'White', 'Black', 'Green', 'King'];
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France'];
    const cities = ['New York', 'Toronto', 'London', 'Sydney', 'Berlin', 'Paris'];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        const firstName = names[Math.floor(Math.random() * names.length)];
        const lastName = surnames[Math.floor(Math.random() * surnames.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const regDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);

        users.push({
            id: { value: `mock-${i + 1}-${Math.random().toString(36).substring(7)}` },
            name: { first: firstName, last: lastName },
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            phone: `+1-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
            location: { country: country, city: city },
            registered: { date: regDate.toISOString() },
            picture: { thumbnail: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Mock' }
        });
    }
    return users;
}

async function loadUsers(withMeta = false) {
    const apiUrl = process.env.RANDOMUSER_API_URL || DEFAULT_API_URL;
    let users = [];
    let fallbackUsed = false;
    let fetchedAt = new Date().toISOString();

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        users = data.results.map(user => ({
            id: { value: user.id?.value || null },
            name: { first: user.name?.first || '', last: user.name?.last || '' },
            email: user.email || '',
            phone: user.phone || '',
            location: { country: user.location?.country || '', city: user.location?.city || '' },
            registered: { date: user.registered?.date || '' },
            picture: { thumbnail: user.picture?.thumbnail || '' }
        }));
        fallbackUsed = false;
    } catch (error) {
        users = fallbackUsers();
        fallbackUsed = true;
        fetchedAt = new Date().toISOString();
    }

    if (withMeta) {
        return { users, fallbackUsed, sourceUrl: apiUrl, fetchedAt };
    }
    return users;
}

function buildMetrics(users) {
    const totalUsers = users.length;
    
    const usersByCountry = users.reduce((acc, user) => {
        const country = user.location?.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
    }, {});

    let totalRegistrationAgeInDays = 0;
    let validRegistrationDates = 0;

    users.forEach(user => {
        try {
            if (user.registered?.date) {
                const registeredDate = new Date(user.registered.date);
                if (!isNaN(registeredDate.getTime())) {
                    const today = new Date();
                    const diffTime = Math.abs(today.getTime() - registeredDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalRegistrationAgeInDays += diffDays;
                    validRegistrationDates++;
                }
            }
        } catch (e) {
            // Ignore invalid dates for this metric
        }
    });

    const averageRegistrationAgeInDays = validRegistrationDates > 0
        ? totalRegistrationAgeInDays / validRegistrationDates
        : 0;

    return {
        totalUsers,
        usersByCountry,
        averageRegistrationAgeInDays: parseFloat(averageRegistrationAgeInDays.toFixed(2))
    };
}

export {
    loadUsers,
    buildMetrics,
    fallbackUsers
};