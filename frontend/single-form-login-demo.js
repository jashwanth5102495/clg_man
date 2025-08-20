// Demo of the updated single-form teacher login

const singleFormLogin = {
  // Single form with all three fields
  formFields: [
    {
      type: 'dropdown',
      label: 'Select Class',
      name: 'selectedClassId',
      required: true,
      options: [
        { value: '', label: 'Choose a class' },
        { value: 'class1', label: 'BCU-MCA-1-1 - MCA 1-1 (BCU)' },
        { value: 'class2', label: 'BCU-BCA-2-3 - BCA 2-3 (BCU)' },
        { value: 'class3', label: 'BNU-MCA-2-4 - MCA 2-4 (BNU)' }
      ]
    },
    {
      type: 'text',
      label: 'Username',
      name: 'username',
      placeholder: 'Enter your username',
      required: true
    },
    {
      type: 'password',
      label: 'Password',
      name: 'password',
      placeholder: 'Enter your password',
      required: true
    }
  ],

  // Login payload sent to backend
  loginPayload: {
    selectedClassId: 'class1',
    username: 'jash',
    password: 'teacher123'
  },

  // Validation logic
  validation: [
    'Check if class is selected',
    'Check if username is entered',
    'Check if password is entered',
    'All fields required before submission'
  ],

  // UI Layout (matches the image you showed)
  layout: {
    title: 'Teacher Login',
    subtitle: 'Enter your credentials to access your class dashboard',
    fields: [
      'Class Selection Dropdown (NEW)',
      'Username Input Field',
      'Password Input Field'
    ],
    button: 'Login',
    note: 'Select your class and use the credentials provided by your admin to login.'
  }
};

// Benefits of single form approach
const benefits = [
  '✅ Simpler user experience - all fields in one form',
  '✅ Matches the UI design you showed in the image',
  '✅ No multi-step navigation needed',
  '✅ Teachers can see all required fields at once',
  '✅ Faster login process',
  '✅ Still resolves multi-class teacher conflicts'
];

// Form behavior
const formBehavior = {
  onLoad: 'Fetch all available classes and populate dropdown',
  onClassSelect: 'Enable username and password fields',
  onSubmit: 'Validate all fields and send login request with classId',
  onError: 'Show error message above form',
  onSuccess: 'Redirect to teacher dashboard for selected class'
};

console.log('Single Form Teacher Login:');
console.log('- Class dropdown at the top');
console.log('- Username field in the middle');
console.log('- Password field at the bottom');
console.log('- Single Login button');
console.log('- All validation happens on submit');

module.exports = { singleFormLogin, benefits, formBehavior };