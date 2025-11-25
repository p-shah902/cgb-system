export interface Menu {
  title: string,
  path: string,
  icon?: string,
  click?: () => void,
  checkPermission?: boolean,
  children?: Menu[],
  roleMap?: string,
}

export const menuItems: Menu[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.06667 6.93333L8 0.533333L14.9333 6.93333V14.4C14.9333 14.9891 14.4558 15.4667 13.8667 15.4667H2.13333C1.54423 15.4667 1.06667 14.9891 1.06667 14.4V6.93333Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round"/>
            <path d="M5.86667 15.4667V10.6667H10.1333V15.4667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round"/>
            <path d="M1.06667 6.93333L8 2.66667L14.9333 6.93333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round"/>
          </svg>`,
    children: [
      {
        path: '/dashboard',
        title: 'Overview',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 2.66667H13.3333C13.7015 2.66667 14 3.03486 14 3.33333V13.3333C14 13.7015 13.7015 14 13.3333 14H2.66667C2.29848 14 2 13.7015 2 13.3333V3.33333C2 3.03486 2.29848 2.66667 2.66667 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667H14M2 10H14" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.66667 2V14" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/inboxoutbox',
        title: 'Inbox Outbox',
        roleMap: 'Inbox Outbox',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 4.66667H13.3333C13.7015 4.66667 14 5.03486 14 5.33333V12.6667C14 13.0349 13.7015 13.3333 13.3333 13.3333H2.66667C2.29848 13.3333 2 13.0349 2 12.6667V5.33333C2 5.03486 2.29848 4.66667 2.66667 4.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667L8 10.6667L14 6.66667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="13.3333" cy="4.66667" r="1.33333" stroke="#1B202B" stroke-width="1.06667"/>
          </svg>`
      },
      // {
      //   path: '#',
      //   title: 'CGB Cycle',
      //   roleMap: 'Cgb Cycle',
      //   icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      //       <circle cx="8" cy="8" r="6.66667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
      //       <path d="M8 2.66667V8L11.3333 10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
      //     </svg>`
      // },
      // {
      //   path: '#',
      //   title: 'Reports',
      //   roleMap: 'Reports',
      //   icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      //       <path d="M3.33333 2.66667H12.6667C13.0349 2.66667 13.3333 2.96514 13.3333 3.33333V12.6667C13.3333 13.0349 13.0349 13.3333 12.6667 13.3333H3.33333C2.96514 13.3333 2.66667 13.0349 2.66667 12.6667V3.33333C2.66667 2.96514 2.96514 2.66667 3.33333 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
      //       <path d="M5.33333 6.66667H10.6667M5.33333 9.33333H8M5.33333 12H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
      //       <path d="M2 3.33333H14" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
      //     </svg>`
      // },
    ],
  },
  // {
  //   path: '/inboxoutbox',
  //   title: 'Inbox Outbox',
  //   checkPermission: true,
  //   roleMap: 'Inbox Outbox',
  //   icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  //           <path
  //             d="M7.99999 0.533203L8.34708 0.128266C8.14735 -0.0429291 7.85263 -0.0429291 7.6529 0.128266L7.99999 0.533203ZM0.533325 6.9332L0.186236 6.52827L-8.16584e-06 6.6879V6.9332H0.533325ZM5.86666 15.4665V15.9999C6.16121 15.9999 6.39999 15.7611 6.39999 15.4665H5.86666ZM10.1333 15.4665H9.59999C9.59999 15.7611 9.83877 15.9999 10.1333 15.9999V15.4665ZM15.4667 6.9332H16V6.6879L15.8137 6.52827L15.4667 6.9332ZM1.59999 15.9999H5.86666V14.9332H1.59999V15.9999ZM15.8137 6.52827L8.34708 0.128266L7.6529 0.93814L15.1196 7.33814L15.8137 6.52827ZM7.6529 0.128266L0.186236 6.52827L0.880414 7.33814L8.34708 0.93814L7.6529 0.128266ZM6.39999 15.4665V12.2665H5.33333V15.4665H6.39999ZM9.59999 12.2665V15.4665H10.6667V12.2665H9.59999ZM10.1333 15.9999H14.4V14.9332H10.1333V15.9999ZM16 14.3999V6.9332H14.9333V14.3999H16ZM-8.16584e-06 6.9332V14.3999H1.06666V6.9332H-8.16584e-06ZM7.99999 10.6665C8.88365 10.6665 9.59999 11.3829 9.59999 12.2665H10.6667C10.6667 10.7938 9.47275 9.59987 7.99999 9.59987V10.6665ZM7.99999 9.59987C6.52723 9.59987 5.33333 10.7938 5.33333 12.2665H6.39999C6.39999 11.3829 7.11634 10.6665 7.99999 10.6665V9.59987ZM14.4 15.9999C15.2836 15.9999 16 15.2835 16 14.3999H14.9333C14.9333 14.6944 14.6945 14.9332 14.4 14.9332V15.9999ZM1.59999 14.9332C1.30544 14.9332 1.06666 14.6944 1.06666 14.3999H-8.16584e-06C-8.16584e-06 15.2835 0.716336 15.9999 1.59999 15.9999V14.9332Z"
  //             fill="#626262" />
  //         </svg>`
  // },
  {
    path: '/all-papers',
    title: 'Papers',
    roleMap: 'Papers',
    checkPermission: true,
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.79998 7.99694H11.2M4.79998 11.1949L11.2 11.2018M4.79998 4.79902L9.06664 4.80182M13.3333 15.4685H2.66664C2.07754 15.4685 1.59998 14.9909 1.59998 14.4018V1.60182C1.59998 1.01272 2.07754 0.535156 2.66664 0.535156H11.2L14.4 3.73516V14.4018C14.4 14.9909 13.9224 15.4685 13.3333 15.4685Z"
              stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round" />
          </svg>`,
    children: [
      {
        path: '/all-papers',
        title: 'All Papers',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 2.66667H13.3333C13.7015 2.66667 14 3.03486 14 3.33333V13.3333C14 13.7015 13.7015 14 13.3333 14H2.66667C2.29848 14 2 13.7015 2 13.3333V3.33333C2 3.03486 2.29848 2.66667 2.66667 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667H14M2 10H14" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/createpaper',
        title: 'Create',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.66667V13.3333M2.66667 8H13.3333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`,
        children: [
          {
            path: '/approach-to-market',
            title: 'Approach to Market',
            icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 5.33333H13.3333C13.7015 5.33333 14 5.63181 14 6V13.3333C14 13.7015 13.7015 14 13.3333 14H2.66667C2.29848 14 2 13.7015 2 13.3333V6C2 5.63181 2.29848 5.33333 2.66667 5.33333Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667L8 10.6667L14 6.66667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
          },
          {
            path: '/contract-award',
            title: 'Contract Award',
            icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.66667L9.33333 5.86667L12.6667 6.4L10.3333 8.8L10.9333 12.2667L8 10.9333L5.06667 12.2667L5.66667 8.8L3.33333 6.4L6.66667 5.86667L8 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
          },
          {
            path: '/variation-paper',
            title: 'Variation',
            icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33333 2.66667H8L10.6667 5.33333V13.3333C10.6667 13.7015 10.3682 14 10 14H3.33333C2.96514 14 2.66667 13.7015 2.66667 13.3333V3.33333C2.66667 2.96514 2.96514 2.66667 3.33333 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 2.66667V5.33333H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 8.66667H8M5.33333 11.3333H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 6.66667L13.3333 8L12 9.33333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
          },
          {
            path: '/approval-of-sale-disposal-form',
            title: 'Sale / Disposal',
            icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 4.66667L3.33333 2.66667H5.33333L6 4.66667M2.66667 4.66667H13.3333M13.3333 4.66667L12.6667 2.66667H10.6667L10 4.66667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.33333 4.66667V13.3333C3.33333 13.7015 3.63181 14 4 14H12C12.3682 14 12.6667 13.7015 12.6667 13.3333V4.66667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
          },
          {
            path: '/info-note',
            title: 'Info Note',
            icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="5.33333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6.66667V8M8 10.6667H8.01333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
          },
          {
            path: '/batch-papers',
            title: 'Batch',
            icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 3.33333H9.33333L12 6V12.6667C12 13.0349 11.7015 13.3333 11.3333 13.3333H2.66667C2.29848 13.3333 2 13.0349 2 12.6667V4C2 3.63181 2.29848 3.33333 2.66667 3.33333Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.33333 3.33333V6H12" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.66667 7.33333H10.6667M4.66667 10H8" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 9.33333H10C10.3682 9.33333 10.6667 9.63181 10.6667 10V13.3333C10.6667 13.7015 10.3682 14 10 14H4C3.63181 14 3.33333 13.7015 3.33333 13.3333V10C3.33333 9.63181 3.63181 9.33333 4 9.33333Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
          } 
        ],
      },
      {
        path: '/my-drafts',
        title: 'My Drafts',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33333 2.66667H8L10.6667 5.33333V13.3333C10.6667 13.7015 10.3682 14 10 14H3.33333C2.96514 14 2.66667 13.7015 2.66667 13.3333V3.33333C2.66667 2.96514 2.96514 2.66667 3.33333 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 2.66667V5.33333H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 8.66667H8M5.33333 11.3333H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="11.3333" cy="4.66667" r="1.33333" stroke="#1B202B" stroke-width="1.06667"/>
          </svg>`
      },
    ]
  },
  {
    path: '/paper-status',
    title: 'Workflow',
    roleMap: 'Workflow',
    checkPermission: true,
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 4H6.66667M9.33333 4H13.3333M2.66667 8H6.66667M9.33333 8H13.3333M2.66667 12H6.66667M9.33333 12H13.3333M1.33333 4C1.33333 3.26362 1.93029 2.66667 2.66667 2.66667C3.40305 2.66667 4 3.26362 4 4C4 4.73638 3.40305 5.33333 2.66667 5.33333C1.93029 5.33333 1.33333 4.73638 1.33333 4ZM1.33333 8C1.33333 7.26362 1.93029 6.66667 2.66667 6.66667C3.40305 6.66667 4 7.26362 4 8C4 8.73638 3.40305 9.33333 2.66667 9.33333C1.93029 9.33333 1.33333 8.73638 1.33333 8ZM1.33333 12C1.33333 11.2636 1.93029 10.6667 2.66667 10.6667C3.40305 10.6667 4 11.2636 4 12C4 12.7364 3.40305 13.3333 2.66667 13.3333C1.93029 13.3333 1.33333 12.7364 1.33333 12ZM12 4C12 3.26362 12.5969 2.66667 13.3333 2.66667C14.0697 2.66667 14.6667 3.26362 14.6667 4C14.6667 4.73638 14.0697 5.33333 13.3333 5.33333C12.5969 5.33333 12 4.73638 12 4ZM12 8C12 7.26362 12.5969 6.66667 13.3333 6.66667C14.0697 6.66667 14.6667 7.26362 14.6667 8C14.6667 8.73638 14.0697 9.33333 13.3333 9.33333C12.5969 9.33333 12 8.73638 12 8ZM12 12C12 11.2636 12.5969 10.6667 13.3333 10.6667C14.0697 10.6667 14.6667 11.2636 14.6667 12C14.6667 12.7364 14.0697 13.3333 13.3333 13.3333C12.5969 13.3333 12 12.7364 12 12Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round"/>
          </svg>`
  },
  {
    path: '/cgb-voting',
    title: 'Approvals',
    roleMap: 'CGB Voting',
    checkPermission: true,
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.73339 0V5.33333M12.2667 0V5.33333M3.20005 8H6.40005M12.8001 8H9.60005M3.20005 11.2H6.40005M9.60005 11.2H12.8001M1.60005 2.66667H14.4001C14.9892 2.66667 15.4667 3.14423 15.4667 3.73333V14.4C15.4667 14.9891 14.9892 15.4667 14.4001 15.4667H1.60005C1.01095 15.4667 0.533386 14.9891 0.533386 14.4V3.73333C0.533386 3.14423 1.01095 2.66667 1.60005 2.66667Z"
              stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" />
          </svg>`,
    children: [
      {
        path: '/pre-cgb-review',
        title: 'Pre-CGB',
        roleMap: 'Pre-CGB Review',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33333 2.66667H8L10.6667 5.33333V13.3333C10.6667 13.7015 10.3682 14 10 14H3.33333C2.96514 14 2.66667 13.7015 2.66667 13.3333V3.33333C2.66667 2.96514 2.96514 2.66667 3.33333 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 2.66667V5.33333H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 8.66667H7.33333M5.33333 10.6667H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.3333 4.66667L12.6667 6L11.3333 7.33333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/cgb-voting',
        title: 'CGB',
        roleMap: 'CGB Voting',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.66667C9.47275 2.66667 10.6667 3.86057 10.6667 5.33333C10.6667 6.8061 9.47275 8 8 8C6.52723 8 5.33333 6.8061 5.33333 5.33333C5.33333 3.86057 6.52723 2.66667 8 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.66667 13.3333C2.66667 11.1242 4.45762 9.33333 6.66667 9.33333H9.33333C11.5424 9.33333 13.3333 11.1242 13.3333 13.3333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 10.6667L10 12.6667L12 10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/partners-approvals',
        title: 'Partners',
        roleMap: 'CGB Voting',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 2.66667H13.3333C13.7015 2.66667 14 3.03486 14 3.33333V13.3333C14 13.7015 13.7015 14 13.3333 14H2.66667C2.29848 14 2 13.7015 2 13.3333V3.33333C2 3.03486 2.29848 2.66667 2.66667 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667H14M2 10H14" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 6.66667H10.6667M5.33333 9.33333H8M5.33333 12H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      }
    ]
  },
  {
    path: '#',
    title: 'Administration',
    roleMap: 'Administration',
    checkPermission: true,
    icon: `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M5.944 1L5.858 1.43671L5.52901 3.03467C5.00301 3.23554 4.526 3.52037 4.095 3.85815L2.487 3.3205L2.05501 3.18658L1.83101 3.57233L0.723999 5.4231L0.5 5.8089L0.828003 6.0957L2.07201 7.15399C2.02701 7.43081 1.96901 7.70461 1.96901 7.99542C1.96901 8.28623 2.02701 8.5601 2.07201 8.83691L0.828003 9.8952L0.5 10.182L0.723999 10.5677L1.83101 12.4186L2.05501 12.8053L2.487 12.6704L4.095 12.1328C4.526 12.4705 5.00301 12.7553 5.52901 12.9562L5.858 14.5541L5.944 14.9909H9.05501L9.142 14.5541L9.47 12.9562C9.996 12.7553 10.473 12.4705 10.904 12.1328L12.512 12.6704L12.944 12.8053L13.169 12.4186L14.275 10.5677L14.5 10.182L14.171 9.8952L12.927 8.83691C12.973 8.5601 13.03 8.28623 13.03 7.99542C13.03 7.70461 12.973 7.43081 12.927 7.15399L14.171 6.0957L14.5 5.8089L14.275 5.4231L13.169 3.57233L12.944 3.18658L12.512 3.3205L10.904 3.85815C10.473 3.52037 9.996 3.23554 9.47 3.03467L9.142 1.43671L9.05501 1H5.944Z"
              stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round" />
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M9.49963 7.99542C9.49963 9.0987 8.60363 9.99414 7.49963 9.99414C6.39563 9.99414 5.49963 9.0987 5.49963 7.99542C5.49963 6.89214 6.39563 5.99677 7.49963 5.99677C8.60363 5.99677 9.49963 6.89214 9.49963 7.99542Z"
              stroke="#1B202B" stroke-width="1.06667" stroke-linecap="square" stroke-linejoin="round" />
          </svg>`,
    children: [
      {
        path: '/roleaccess',
        title: 'Roles',
        roleMap: 'Roles',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.66667C9.47275 2.66667 10.6667 3.86057 10.6667 5.33333C10.6667 6.8061 9.47275 8 8 8C6.52723 8 5.33333 6.8061 5.33333 5.33333C5.33333 3.86057 6.52723 2.66667 8 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.66667 13.3333C2.66667 11.1242 4.45762 9.33333 6.66667 9.33333H9.33333C11.5424 9.33333 13.3333 11.1242 13.3333 13.3333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/usermanagement',
        title: 'Users',
        roleMap: 'Users',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="4" r="2" stroke="#1B202B" stroke-width="1.06667"/>
            <circle cx="12" cy="4" r="2" stroke="#1B202B" stroke-width="1.06667"/>
            <path d="M2 12C2 9.79086 3.79086 8 6 8H10C12.2091 8 14 9.79086 14 12" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/dictionaries-list',
        title: 'Dictionaries',
        roleMap: 'Dictionaries',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33333 2.66667H12.6667C13.0349 2.66667 13.3333 2.96514 13.3333 3.33333V12.6667C13.3333 13.0349 13.0349 13.3333 12.6667 13.3333H3.33333C2.96514 13.3333 2.66667 13.0349 2.66667 12.6667V3.33333C2.66667 2.96514 2.96514 2.66667 3.33333 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 5.33333H10.6667M5.33333 8H8M5.33333 10.6667H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/threshold',
        title: 'Thresholds',
        roleMap: 'Thresholds',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 2.66667L13.3333 2.66667L13.3333 13.3333L2.66667 13.3333L2.66667 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.66667 8H13.3333M8 2.66667V13.3333" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      },
      {
        path: '/vendors',
        title: 'Vendors',
        roleMap: 'Vendors',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 4.66667H13.3333C13.7015 4.66667 14 5.03486 14 5.33333V12.6667C14 13.0349 13.7015 13.3333 13.3333 13.3333H2.66667C2.29848 13.3333 2 13.0349 2 12.6667V5.33333C2 5.03486 2.29848 4.66667 2.66667 4.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667H14M6 10H10" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="5.33333" cy="3.33333" r="1.33333" stroke="#1B202B" stroke-width="1.06667"/>
            <circle cx="10.6667" cy="3.33333" r="1.33333" stroke="#1B202B" stroke-width="1.06667"/>
          </svg>`
      },
      {
        path: '#',
        title: 'Emails & Notifications',
        roleMap: 'Emails & Notifications',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 4.66667H13.3333C13.7015 4.66667 14 5.03486 14 5.33333V12.6667C14 13.0349 13.7015 13.3333 13.3333 13.3333H2.66667C2.29848 13.3333 2 13.0349 2 12.6667V5.33333C2 5.03486 2.29848 4.66667 2.66667 4.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667L8 10.6667L14 6.66667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="13.3333" cy="4.66667" r="1.33333" stroke="#1B202B" stroke-width="1.06667"/>
          </svg>`
      },
      {
        path: '/audit-logs',
        title: 'Audit Log',
        roleMap: 'Audit Log',
        checkPermission: true,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.33333 2.66667H12.6667C13.0349 2.66667 13.3333 2.96514 13.3333 3.33333V12.6667C13.3333 13.0349 13.0349 13.3333 12.6667 13.3333H3.33333C2.96514 13.3333 2.66667 13.0349 2.66667 12.6667V3.33333C2.66667 2.96514 2.96514 2.66667 3.33333 2.66667Z" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 6.66667H10.6667M5.33333 9.33333H8M5.33333 12H10.6667" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 3.33333H14" stroke="#1B202B" stroke-width="1.06667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
      }
    ],
  },
]
