const addMemberBtn = document.getElementById('add-member-btn');
const cancelBtn = document.getElementById('cancel-btn');
const dialog = document.getElementById('member-modal');
const memberForm = document.getElementById('member-form');
const grid = document.getElementById('grid');

let membersArr = []

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

        if (!/[0-9]/.test(rawOffsetString)) {
            return 0;
        }

        let cleanOffset = rawOffsetString.replace(':30', '.5').replace(':45', '.75');
        cleanOffset = cleanOffset.replace(/[A-Z]/gi, '');

        const decimalOffset = parseFloat(cleanOffset);

        return isNaN(decimalOffset) ? 0 : decimalOffset;
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

        const {startUTC, endUTC} = member.getUTCWorkHours();

        for (let i = 0; i < 24; i++) {
            const timelineSlot = document.createElement('p');
            timelineSlot.className = 'timeline-slot';
            timelineSlot.role = 'cell';

            let isWorking = false;

            if (startUTC < endUTC) {
                if (i >= startUTC && i < endUTC) {
                    isWorking = true;
                }
            } else {
                if (i >= startUTC || i < endUTC) {
                    isWorking = true;
                }
            }

            if (isWorking) {
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