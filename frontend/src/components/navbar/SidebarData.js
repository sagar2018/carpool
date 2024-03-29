import React from 'react';
// import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as MdIcons from 'react-icons/md';


export const SidebarData = [
  {
    title: 'Ride Requests',
    path: '/ride-request',
    icon: <MdIcons.MdPeopleOutline color='black' />,
  },
  {
    title: 'Drive Requests',
    path: '/drive-request',
    icon: <AiIcons.AiOutlineCar color='black' />,
  },
  {
    title: 'Trip History',
    path: '/trip-history',
    icon: <BsIcons.BsCardChecklist color='black' />,
  },
  {
    title: 'Contact Us',
    path: '/contactus',
    icon: <MdIcons.MdPermPhoneMsg color='black' />,
  },
  {
    title: 'Admin Page',
    path: '/admin',
    icon: <MdIcons.MdAdminPanelSettings color='black' />,
  },
];
