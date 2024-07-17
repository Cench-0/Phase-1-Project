document.addEventListener('DOMContentLoaded', () => {
    fetchBabyItems();
    
    document.getElementById('rental-form').addEventListener('submit', submitRentalRequest);
  });
  
  // Fetch and display all baby items
  function fetchBabyItems() {
    fetch('http://localhost:3000/babyItems')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const container = document.getElementById('items-container');
        container.innerHTML = ''; // Clear existing items
        data.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('item');
  
          const img = document.createElement('img');
          img.src = item.image;
          img.alt = item.name;
  
          const name = document.createElement('h2');
          name.textContent = item.name;
  
          const description = document.createElement('p');
          description.textContent = item.description;
  
          const price = document.createElement('p');
          price.textContent = `Rental Price: $${item.rentalPrice}`;
  
          const availability = document.createElement('p');
          availability.textContent = `Available: ${item.availabilityCount}`;
  
          const rentButton = document.createElement('button');
          rentButton.textContent = 'Rent';
          rentButton.classList.add('rent');
          rentButton.addEventListener('click', () => rentItem(item, availability));
  
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('delete');
          deleteButton.addEventListener('click', () => deleteItem(item, availability));
  
          itemDiv.append(img, name, description, price, availability, rentButton, deleteButton);
          container.appendChild(itemDiv);
        });
      })
      .catch(error => {
        console.error('Error fetching baby items:', error);
      });
  }
  
  // Rent an item
  function rentItem(item, availabilityElement) {
    if (item.availabilityCount > 0) {
      const previousAvailabilityCount = item.availabilityCount;
      item.availabilityCount--;
  
      fetch(`http://localhost:3000/babyItems/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availabilityCount: item.availabilityCount })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Item rented:', data);
          availabilityElement.textContent = `Available: ${item.availabilityCount}`;
        })
        .catch(error => {
          console.error('Error renting item:', error);
          item.availabilityCount = previousAvailabilityCount; // Revert on error
          availabilityElement.textContent = `Available: ${item.availabilityCount}`;
        });
    } else {
      alert('Item is not available for rent.');
    }
  }
  
  // Delete an item
  function deleteItem(item, availabilityElement) {
    const previousAvailabilityCount = item.availabilityCount;
    item.availabilityCount++;
  
    fetch(`http://localhost:3000/babyItems/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ availabilityCount: item.availabilityCount })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return fetch(`http://localhost:3000/babyItems/${item.id}`, {
          method: 'DELETE'
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Item deleted:', data);
        fetchBabyItems(); // Refresh the item list
      })
      .catch(error => {
        console.error('Error deleting item:', error);
        item.availabilityCount = previousAvailabilityCount; // Revert on error
        availabilityElement.textContent = `Available: ${item.availabilityCount}`;
      });
  }
  
  // Submit a new rental request (example form handling)
  function submitRentalRequest(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const rentalData = {
      name: formData.get('name'),
      description: formData.get('description'),
      image: formData.get('image'),
      rentalPrice: parseFloat(formData.get('rentalPrice')),
      availabilityStatus: formData.get('availabilityStatus'),
      availabilityCount: parseInt(formData.get('availabilityCount'), 10)
    };
  
    fetch('http://localhost:3000/babyItems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rentalData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Rental submitted:', data);
        fetchBabyItems(); // Refresh the item list
      })
      .catch(error => {
        console.error('Error submitting rental request:', error);
      });
  }
  