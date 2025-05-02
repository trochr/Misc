function encode() {
    const jsonInput = document.getElementById('jsonInput').value;
    const compressedOutput = document.getElementById('compressedOutput');
    const error = document.getElementById('error');
    error.style.display = 'none';

    try {
        const { topClues, leftClues } = JSON.parse(jsonInput);
        if (!Array.isArray(topClues) || !Array.isArray(leftClues)) {
            throw new Error('Invalid JSON structure');
        }
        const width = topClues.length;
        const height = leftClues.length;
        if (width > 15 || height > 15) {
            throw new Error('Grid size exceeds 15x15');
        }

        // Count total numbers
        const topCount = topClues.reduce((sum, group) => sum + group.length, 0);
        const leftCount = leftClues.reduce((sum, group) => sum + group.length, 0);
        if (topCount > 127 || leftCount > 127) throw new Error('Too many numbers');

        // Header: 4 bits width, 4 bits height, 7 bits topCount, 7 bits leftCount
        let bits = (width).toString(2).padStart(4, '0') +
                   (height).toString(2).padStart(4, '0') +
                   topCount.toString(2).padStart(7, '0') +
                   leftCount.toString(2).padStart(7, '0');

        // Data: topClues
        topClues.forEach(group => {
            group.forEach((num, idx) => {
                if (num < 0 || num > 15) throw new Error('Numbers must be 0-15');
                bits += num.toString(2).padStart(4, '0') + (idx === group.length - 1 ? '1' : '0');
            });
        });

        // Data: leftClues
        leftClues.forEach(group => {
            group.forEach((num, idx) => {
                if (num < 0 || num > 15) throw new Error('Numbers must be 0-15');
                bits += num.toString(2).padStart(4, '0') + (idx === group.length - 1 ? '1' : '0');
            });
        });

        // Pad to byte boundary
        while (bits.length % 8 !== 0) bits += '0';
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) {
            bytes.push(parseInt(bits.slice(i, i + 8), 2));
        }

        const base64 = btoa(String.fromCharCode(...bytes));
        compressedOutput.value = base64;
    } catch (e) {
        error.style.display = 'block';
        error.textContent = 'Error: Invalid input - ' + e.message;
    }
}

function decode() {
    const compressedInput = document.getElementById('compressedInput').value;
    const jsonOutput = document.getElementById('jsonOutput');
    const error = document.getElementById('error');
    error.style.display = 'none';

    try {
        const bytes = atob(compressedInput).split('').map(c => c.charCodeAt(0));
        let bits = bytes.map(b => b.toString(2).padStart(8, '0')).join('');

        // Header
        const width = parseInt(bits.slice(0, 4), 2);
        const height = parseInt(bits.slice(4, 8), 2);
        const topCount = parseInt(bits.slice(8, 15), 2);
        const leftCount = parseInt(bits.slice(15, 22), 2);
        const dataBits = bits.slice(22);

        if (width < 1 || width > 15 || height < 1 || height > 15) {
            throw new Error('Grid size out of range (1-15)');
        }

        const topClues = [];
        const leftClues = [];
        let currentGroup = [];
        let numberCount = 0;
        let groupCount = 0;

        // Parse data
        for (let i = 0; i < dataBits.length; i += 5) {
            if (numberCount >= topCount + leftCount) break;
            const value = parseInt(dataBits.slice(i, i + 4), 2);
            const marker = dataBits[i + 4];

            currentGroup.push(value);
            numberCount++;

            if (marker === '1') {
                if (numberCount <= topCount) {
                    topClues.push([...currentGroup]);
                    groupCount++;
                    if (groupCount > width) throw new Error('Too many topClues groups');
                } else {
                    leftClues.push([...currentGroup]);
                    groupCount = groupCount > width ? groupCount : width + 1;
                    if (groupCount > width + height) throw new Error('Too many leftClues groups');
                }
                currentGroup = [];
            }
        }

        if (topClues.length !== width || leftClues.length !== height) {
            throw new Error('Group count mismatch with header');
        }

        const result = { topClues, leftClues };
        jsonOutput.value = JSON.stringify(result, null, 2);
    } catch (e) {
        error.style.display = 'block';
        error.textContent = 'Error: Invalid input - ' + e.message;
    }
}
