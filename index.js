let isEditingPost = false;
let currentEditingPostId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchBabyItems();

    document.getElementById('post-item-button').addEventListener('click', openPostModal);
    document.querySelector('#postModal .close').addEventListener('click', closePostModal);
    document.getElementById('post-form').addEventListener('submit', submitPostForm);

    document.querySelector('#rentModal .close').addEventListener('click', closeRentModal);
    document.getElementById('rent-form').addEventListener('submit', submitRentForm);

    document.getElementById('user-rentals-link').addEventListener('click', (e) => {
        e.preventDefault();
        renderUserRentals();
    });

    // Clear form fields when opening the post modal
    document.getElementById('post-item-button').addEventListener('click', () => {
        document.getElementById('item-name').value = '';
        document.getElementById('description').value = '';
        document.getElementById('image').value = '';
        document.getElementById('rentalPrice').value = '';
        document.getElementById('availabilityCount').value = '';
        isEditingPost = false; // Reset editing state
    });
});

let userRentals = [];
let userPostedItems = [];
let isEditingRental = false;
let currentEditingRentalId = null;

function fetchBabyItems() {
    fetch('http://localhost:3000/babyItems')
        .then(response => response.json())
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
                rentButton.addEventListener('click', () => {
                    if (item.availabilityCount > 0) {
                        openRentModal(item);
                    } else {
                        alert('No items available for rent.');
                    }
                });

                itemDiv.append(img, name, description, price, availability, rentButton);

                if (userPostedItems.some(postedItem => postedItem.id === item.id)) {
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.classList.add('edit');
                    editButton.addEventListener('click', () => {
                        openPostModal(item);
                        isEditingPost = true;
                        currentEditingPostId = item.id;
                    });

                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('delete');
                    deleteButton.addEventListener('click', () => deletePostedItem(item.id));

                    itemDiv.append(editButton, deleteButton);
                }

                container.appendChild(itemDiv);
            });
        });
}

function openRentModal(item) {
    document.getElementById('rent-item-name').textContent = item.name;
    document.getElementById('rent-item-id').value = item.id;
    document.getElementById('rentModal').style.display = 'block';
}

function closeRentModal() {
    document.getElementById('rentModal').style.display = 'none';
    isEditingRental = false;
    currentEditingRentalId = null;
}

function submitRentForm(event) {
    event.preventDefault();

    const itemId = document.getElementById('rent-item-id').value;
    const userName = document.getElementById('user-name').value;
    const rentQuantity = parseInt(document.getElementById('rent-quantity').value, 10);
    const userPhone = document.getElementById('user-phone').value;
    const userAddress = document.getElementById('user-address').value;

    if (isEditingRental) {
        updateRental(currentEditingRentalId, itemId, userName, rentQuantity, userPhone, userAddress);
    } else {
        createRental(itemId, userName, rentQuantity, userPhone, userAddress);
    }
}

function createRental(itemId, userName, rentQuantity, userPhone, userAddress) {
    fetch(`http://localhost:3000/babyItems/${itemId}`)
        .then(response => response.json())
        .then(item => {
            if (item.availabilityCount >= rentQuantity) {
                item.availabilityCount -= rentQuantity;

                fetch(`http://localhost:3000/babyItems/${itemId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ availabilityCount: item.availabilityCount })
                })
                    .then(() => {
                        userRentals.push({ id: Date.now().toString(), itemId, userName, rentQuantity, userPhone, userAddress });
                        localStorage.setItem('userRentals', JSON.stringify(userRentals));
                        closeRentModal();
                        fetchBabyItems();
                    });
            } else {
                alert('Not enough items available for rent.');
            }
        });
}

function updateRental(rentalId, itemId, userName, newRentQuantity, userPhone, userAddress) {
    const rentalIndex = userRentals.findIndex(rental => rental.id === rentalId);
    if (rentalIndex !== -1) {
        const oldRentQuantity = userRentals[rentalIndex].rentQuantity;

        fetch(`http://localhost:3000/babyItems/${itemId}`)
            .then(response => response.json())
            .then(item => {
                item.availabilityCount += oldRentQuantity; // Revert the old quantity

                if (item.availabilityCount >= newRentQuantity) {
                    item.availabilityCount -= newRentQuantity;

                    fetch(`http://localhost:3000/babyItems/${itemId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ availabilityCount: item.availabilityCount })
                    })
                        .then(() => {
                            userRentals[rentalIndex] = { ...userRentals[rentalIndex], userName, rentQuantity: newRentQuantity, userPhone, userAddress };
                            localStorage.setItem('userRentals', JSON.stringify(userRentals));
                            closeRentModal();
                            renderUserRentals();
                            fetchBabyItems();
                        });
                } else {
                    alert('Not enough items available for the new quantity.');
                }
            });
    }
}

function renderUserRentals() {
    const rentalsContainer = document.getElementById('user-rentals');
    rentalsContainer.innerHTML = '';

    userRentals.forEach(rental => {
        fetch(`http://localhost:3000/babyItems/${rental.itemId}`)
            .then(response => response.json())
            .then(item => {
                const rentalDiv = document.createElement('div');
                rentalDiv.classList.add('item');

                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.name;

                const name = document.createElement('h2');
                name.textContent = item.name;

                const quantity = document.createElement('p');
                quantity.textContent = `Quantity: ${rental.rentQuantity}`;

                const userName = document.createElement('p');
                userName.textContent = `Rented by: ${rental.userName}`;

                const userPhone = document.createElement('p');
                userPhone.textContent = `Phone: ${rental.userPhone}`;

                const userAddress = document.createElement('p');
                userAddress.textContent = `Address: ${rental.userAddress}`;

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit');
                editButton.addEventListener('click', () => {
                    isEditingRental = true;
                    currentEditingRentalId = rental.id;
                    openRentModal(item);
                    document.getElementById('user-name').value = rental.userName;
                    document.getElementById('rent-quantity').value = rental.rentQuantity;
                    document.getElementById('user-phone').value = rental.userPhone;
                    document.getElementById('user-address').value = rental.userAddress;
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete');
                deleteButton.addEventListener('click', () => deleteRental(rental.id, rental.rentQuantity));

                rentalDiv.append(img, name, quantity, userName, userPhone, userAddress, editButton, deleteButton);
                rentalsContainer.appendChild(rentalDiv);
            });
    });

    rentalsContainer.style.display = 'block';
}

function deleteRental(rentalId, rentQuantity) {
    const rentalIndex = userRentals.findIndex(rental => rental.id === rentalId);
    if (rentalIndex !== -1) {
        const itemId = userRentals[rentalIndex].itemId;

        fetch(`http://localhost:3000/babyItems/${itemId}`)
            .then(response => response.json())
            .then(item => {
                item.availabilityCount += rentQuantity;

                fetch(`http://localhost:3000/babyItems/${itemId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ availabilityCount: item.availabilityCount })
                })
                    .then(() => {
                        userRentals.splice(rentalIndex, 1);
                        localStorage.setItem('userRentals', JSON.stringify(userRentals));
                        renderUserRentals();
                        fetchBabyItems();
                    });
            });
    }
}

function openPostModal(item) {
    if (item) {
        document.getElementById('item-name').value = item.name;
        document.getElementById('description').value = item.description;
        document.getElementById('rentalPrice').value = item.rentalPrice;
        document.getElementById('availabilityCount').value = item.availabilityCount;
    } else {
        document.getElementById('post-form').reset();
    }
    document.getElementById('postModal').style.display = 'block';
}

function closePostModal() {
    document.getElementById('postModal').style.display = 'none';
}

function submitPostForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newItem = {
        id: isEditingPost ? currentEditingPostId : Date.now().toString(),
        name: formData.get('name'),
        description: formData.get('description'),
        image: URL.createObjectURL(formData.get('image')),
        rentalPrice: parseFloat(formData.get('rentalPrice')),
        availabilityCount: parseInt(formData.get('availabilityCount'), 10)
    };

    const method = isEditingPost ? 'PATCH' : 'POST';
    const url = isEditingPost ? `http://localhost:3000/babyItems/${currentEditingPostId}` : 'http://localhost:3000/babyItems';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
    })
        .then(() => {
            if (isEditingPost) {
                const index = userPostedItems.findIndex(item => item.id === currentEditingPostId);
                userPostedItems[index] = newItem;
                isEditingPost = false;
                currentEditingPostId = null;
            } else {
                userPostedItems.push(newItem);
            }
            localStorage.setItem('userPostedItems', JSON.stringify(userPostedItems));
            closePostModal();
            fetchBabyItems();
        });
}

function deletePostedItem(itemId) {
    fetch(`http://localhost:3000/babyItems/${itemId}`, {
        method: 'DELETE'
    })
        .then(() => {
            userPostedItems = userPostedItems.filter(item => item.id !== itemId);
            localStorage.setItem('userPostedItems', JSON.stringify(userPostedItems));
            fetchBabyItems();
        });
}

// Initial load from local storage
document.addEventListener('DOMContentLoaded', () => {
    const savedRentals = localStorage.getItem('userRentals');
    const savedPostedItems = localStorage.getItem('userPostedItems');
    if (savedRentals) userRentals = JSON.parse(savedRentals);
    if (savedPostedItems) userPostedItems = JSON.parse(savedPostedItems);
    renderUserRentals();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchBabyItems();

    document.getElementById('rental-form').addEventListener('submit', submitRentalRequest);

    // Clear form fields when opening the post modal
    document.getElementById('post-item-button').addEventListener('click', () => {
        document.getElementById('item-name').value = '';
        document.getElementById('description').value = '';
        document.getElementById('image').value = '';
        document.getElementById('rentalPrice').value = '';
        document.getElementById('availabilityCount').value = '';
    });
});
