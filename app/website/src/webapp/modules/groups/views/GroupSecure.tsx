import React, { useEffect, useState, ReactNode } from 'react';
import { SiteRoles } from 'awayto';
import { useGroupSecure } from 'awayto-hooks';

declare global {
  interface IProps {
    contentGroupRoles?: SiteRoles[];
    children?: ReactNode;
  }
}

export function GroupSecure ({ contentGroupRoles = [SiteRoles.APP_GROUP_ADMIN], children }: IProps): JSX.Element {

  const hasGroupRole = useGroupSecure();

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(hasGroupRole(contentGroupRoles));
  }, [hasGroupRole]);

  return <> {isValid ? children : <></>} </>
}

export default GroupSecure;
