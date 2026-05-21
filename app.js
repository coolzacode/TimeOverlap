const addMemberBtn = document.getElementById('add-member-btn');
const cancelBtn = document.getElementById('cancel-btn');
const dialog = document.getElementById('member-modal');
const memberForm = document.getElementById('member-form');

let membersArr = []

class MemberProfile {
    constructor (name, location, timezoneOffset, startTime, endTime) {
        this.name = name;
        this.location = location;
        this.timezoneOffset = Number(timezoneOffset);
        this.startTime = Number(startTime);
        this.endTime = Number(endTime);
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

    console.log(membersArr);
}

addMemberBtn.addEventListener('click', () => dialog.showModal());
cancelBtn.addEventListener('click', () => {
    memberForm.reset();
    dialog.close();
});
memberForm.addEventListener('submit', handleFormSubmit);