	// Additional js code:

    const numbers = document.querySelectorAll('.number');

    function toggleScratch(cell: Element) {
        // Toggle the 'scratched' class on the clicked cell
        cell.classList.toggle('scratched');
    }

    numbers.forEach(number => {
        number.addEventListener('click', () => {
            toggleScratch(number);
        });
    });