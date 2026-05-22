const addMemberBtn = document.getElementById('add-member-btn');
const cancelBtn = document.getElementById('cancel-btn');
const dialog = document.getElementById('member-modal');
const memberForm = document.getElementById('member-form');
const grid = document.getElementById('grid');

let membersArr = []

// converts am/pm string to 24-hour integers (0-23)
function convertTimeTo24(timeStr) {
    if (!timeStr) return 0;

    const hour = parseInt(timeStr.replace(/(am|pm)/, ""));
    const period = timeStr.slice(-2).toLowerCase();

    if (period === "am") {
        return hour === 12 ? 0 : hour;
    } else {
        return hour === 12 ? 12 : hour + 12;
    }
}

class MemberProfile {
    constructor (name, location, timezone, localStart, localEnd) {
        this.name = name;
        this.location = location;
        this.timezone = timezone;
        this.localStart = Number(localStart);
        this.localEnd = Number(localEnd);
    }

    // get's the current GMT offset as a float (ex. -5 or 5.5)
    getUTCOffset() {
        const offsetFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.timezone,
            timeZoneName: 'shortOffset'
        });

        const dateTimeParts = offsetFormatter.formatToParts(new Date());
        const timezonePart = dateTimeParts.find(part => part.type === 'timeZoneName');
        const rawOffsetString = timezonePart.value; 

        if (!/[0-9]/.test(rawOffsetString)) return 0;

        let cleanOffset = rawOffsetString.replace(':30', '.5').replace(':45', '.75');
        cleanOffset = cleanOffset.replace(/[A-Z]/gi, '');

        const decimalOffset = parseFloat(cleanOffset);
        return isNaN(decimalOffset) ? 0 : decimalOffset;
    }

    // converts local hours to UTC grid indices (0-23)
    getUTCWorkHours() {
        const currentOffset = this.getUTCOffset(); 
        const hourIndexStartUTC = (this.localStart - currentOffset + 24) % 24;
        const hourIndexEndUTC = (this.localEnd - currentOffset + 24) % 24;

        return {
            startUTC: hourIndexStartUTC, 
            endUTC: hourIndexEndUTC
        };
    }

    // checks if member is working at a specific UTC hour
    isWorkingAtHour(utcHour) {
        const {startUTC, endUTC} = this.getUTCWorkHours();
        if (startUTC < endUTC) {
            return utcHour >= startUTC && utcHour < endUTC;
        } else {
            return utcHour >= startUTC || utcHour < endUTC;
        }
    }
}

// updates the Info Section with current times and active member count
function updateAppInfo() {
    const localTimeDisplay = document.getElementById('local-time');
    const utcTimeDisplay = document.getElementById('utc-time');
    const totalWorkingDisplay = document.getElementById('total-working');

    if (!localTimeDisplay || !utcTimeDisplay || !totalWorkingDisplay) return;

    const currTime = new Date();
    const currentUTCHour = currTime.getUTCHours();

    localTimeDisplay.textContent = currTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    utcTimeDisplay.textContent = currTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', timeZone: 'UTC'});

    const workingCount = membersArr.filter(member => member.isWorkingAtHour(currentUTCHour)).length;
    totalWorkingDisplay.textContent = `${workingCount} member${workingCount === 1 ? '' : 's'}`;
}

// adds new member's info into array and calls renderGrid()
function handleFormSubmit(e) {
    e.preventDefault(); 
    const formData = new FormData(e.target);

    const startTime24 = convertTimeTo24(formData.get('start-time'));
    const endTime24 = convertTimeTo24(formData.get('end-time'));

    const newMember = new MemberProfile(
        formData.get('name'),
        formData.get('location'),
        formData.get('timezone'),
        startTime24,
        endTime24
    );

    membersArr.push(newMember);
    e.target.reset();
    dialog.close();
    renderGrid();
}

// display members onto the grid
function renderGrid() {
    const existingHeader = document.querySelector('.grid-header');
    grid.replaceChildren();
    if (existingHeader) {
        grid.appendChild(existingHeader);
    }

    const fragment = document.createDocumentFragment();

    membersArr.forEach(member => {
        const memberRow = document.createElement('div');
        const memberName = document.createElement('p');
        const memberLoc = document.createElement('p');

        memberRow.className = 'member-row';
        memberName.className = 'member-name';
        memberLoc.className = 'member-loc';

        memberName.textContent = member.name;
        memberLoc.textContent = member.location;
        
        memberRow.appendChild(memberName);
        memberRow.appendChild(memberLoc);

        for (let i = 0; i < 24; i++) {
            const timelineSlot = document.createElement('p');
            timelineSlot.className = 'timeline-slot';
            timelineSlot.role = 'cell';

            if (member.isWorkingAtHour(i)) {
                timelineSlot.classList.add('slot-highlight');
            }

            memberRow.appendChild(timelineSlot);
        }
        fragment.appendChild(memberRow);
    });
    grid.appendChild(fragment);
}


addMemberBtn.addEventListener('click', () => dialog.showModal());
cancelBtn.addEventListener('click', () => {
    memberForm.reset();
    dialog.close();
});
memberForm.addEventListener('submit', handleFormSubmit);

setInterval(updateAppInfo, 30000); // 30 seconds
updateAppInfo();