const addMemberBtn = document.getElementById('add-member-btn');
const cancelBtn = document.getElementById('cancel-btn');
const dialog = document.getElementById('member-modal');
const memberForm = document.getElementById('member-form');
const grid = document.getElementById('grid');

let membersArr = []

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

        const numericOffsetString = rawOffsetString.replace('GMT', '').replace(':', '.');
        const decimalOffset = parseFloat(numericOffsetString);

        return decimalOffset || 0;
    }

    // gets the abbreviation of the timezone
    getTimezoneAbbr() {
        const abbrFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.timezone,
            timeZoneName: 'short'
        });

        const dateTimeParts = abbrFormatter.formatToParts(new Date());
        const timezonePart = dateTimeParts.find(part => part.type === 'timeZoneName');

        return timezonePart.value;
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
}

function handleFormSubmit(e) {
    e.preventDefault(); 
    const formData = new FormData(e.target);

    const newMember = new MemberProfile(
        formData.get('name'),
        formData.get('location'),
        formData.get('timezone'),
        formData.get('start-time'),
        formData.get('end-time')
    );
    membersArr.push(newMember);

    e.target.reset();
    dialog.close();

    renderGrid();
}

function renderGrid() {
    const existingHeader = document.querySelector('.grid-header');
    grid.replaceChildren();
    if (existingHeader) {
        grid.appendChild(existingHeader);
    }
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < membersArr.length; i++) {
        const memberRow = document.createElement('div');
        const memberName = document.createElement('p');
        const memberLoc = document.createElement('p');

        memberRow.className = 'member-row';
        memberName.className = 'member-name';
        memberLoc.className = 'member-loc';

        memberName.textContent = membersArr[i].name;
        memberLoc.textContent = membersArr[i].location;
        
        memberRow.appendChild(memberName);
        memberRow.appendChild(memberLoc);

        for (let j = 0; j < 24; j++) {
            const timelineSlot = document.createElement('p');
            timelineSlot.className = 'timeline-slot';
            timelineSlot.role = 'cell';
            memberRow.appendChild(timelineSlot);
        }
        fragment.appendChild(memberRow);
    }
    grid.appendChild(fragment);
}


addMemberBtn.addEventListener('click', () => dialog.showModal());
cancelBtn.addEventListener('click', () => {
    memberForm.reset();
    dialog.close();
});
memberForm.addEventListener('submit', handleFormSubmit);