'use client';
import CRMPage, { CRM_MANAGER_ROLES } from '@/components/crm/CRMPage';
import CRMSalespeople from '@/screens/crm/CRMSalespeople';
export default function Page() { return <CRMPage roles={CRM_MANAGER_ROLES}><CRMSalespeople /></CRMPage>; }
