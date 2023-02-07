import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import PersonIcon from '@mui/icons-material/Person';

import { IUserProfile, IUserProfileActionTypes, IUtilActionTypes, IPreviewFile, IGroupActionTypes, IRoleActionTypes } from 'awayto';
import { useRedux, useApi, useAct, useComponents, useFileStore } from 'awayto-hooks';

import { useStyles } from '../../../style';

const { SET_SNACK } = IUtilActionTypes;
const { GET_ROLES } = IRoleActionTypes;
const { CHECK_GROUPS_NAME, DELETE_GROUPS, POST_GROUPS, PUT_GROUPS } = IGroupActionTypes;
const { GET_USER_PROFILE_DETAILS, POST_USER_PROFILE, PUT_USER_PROFILE } = IUserProfileActionTypes;

export function Profile(props: IProps): JSX.Element {
  const classes = useStyles();

  const api = useApi();
  const act = useAct();
  const fileStore = useFileStore();
  const { PickTheme, ManageGroups } = useComponents();

  const user = useRedux(state => state.profile);

  const [displayImage, setDisplayImage] = useState('');
  const [file, setFile] = useState<IPreviewFile>();
  const [profile, setProfile] = useState<Partial<IUserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    image: ''
  });

  const { getRootProps, getInputProps } = useDropzone({
    maxSize: 1000000,
    maxFiles: 1,
    accept: {
      'image/*': []
    },
    onDrop: (acceptedFiles: File[]) => {
      const acceptedFile = acceptedFiles.pop()
      if (acceptedFile) {
        setFile(acceptedFile);
        setDisplayImage(URL.createObjectURL(acceptedFile));
      }
    }
  });

  useEffect(() => {
    void api(GET_USER_PROFILE_DETAILS, true);
  }, []);

  useEffect(() => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
  }, [file]);

  useEffect(() => {
    async function getImage() {
      if (fileStore && profile.image) {
        setDisplayImage(await fileStore.get(profile.image));
      }
    }
    void getImage();
  }, [fileStore, profile.image]);

  useEffect(() => {
    if (user) {
      setProfile({ ...profile, ...user });
    }
  }, [user]);

  const deleteFile = () => {
    setProfile({ ...profile, ...{ image: '' } });
    setDisplayImage('');
  }

  const handleSubmit = async () => {
    if (file) {
      profile.image = await fileStore?.put(file);
    }
    console.log('just put profile with image', profile);
    void api(profile.id ? PUT_USER_PROFILE : POST_USER_PROFILE, true, profile);
    act(SET_SNACK, { snackType: 'success', snackOn: 'Profile updated!' });
    setFile(undefined);
  }

  return <>
    {profile && (
      <Grid container spacing={6}>
        <Grid item xs={12} sm={4}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Typography variant="h6">Profile</Typography>
            </Grid>
            <Grid item>
              <TextField fullWidth id="firstName" label="First Name" autoComplete="on" value={profile.firstName} name="firstName" onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
            </Grid>
            <Grid item>
              <TextField fullWidth id="lastName" label="Last Name" autoComplete="on" value={profile.lastName} name="lastName" onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
            </Grid>
            <Grid item>
              <TextField fullWidth id="email" label="Email" autoComplete="on" value={profile.email} name="email" onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </Grid>
            <Grid item>
              <Typography variant="h6">Settings</Typography>
            </Grid>
            <Grid item>
              <PickTheme {...props} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Typography variant="h6">Image</Typography>
            </Grid>
            <Grid item>
              <CardActionArea style={{ padding: '12px' }}>
                {!displayImage ?
                  <Grid {...getRootProps()} container alignItems="center" direction="column">
                    <input {...getInputProps()} />
                    <Grid item>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </Grid>
                    <Grid item>
                      <Typography variant="subtitle1">Click or drag and drop to add a profile pic.</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption">Max size: 1MB</Typography>
                    </Grid>
                  </Grid> :
                  <Grid onClick={deleteFile} container alignItems="center" direction="column">
                    <Grid item>
                      <Avatar src={displayImage} /> {/*<AsyncAvatar image={profile.image || ''} {...props} /> */}
                    </Grid>
                    <Grid item>
                      <Typography variant="h6" style={{ wordBreak: 'break-all' }}>{user.image ? "Current profile image." : file ? `${file.name || ''} added.` : ''}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="subtitle1">To remove, click here then submit.</Typography>
                    </Grid>
                  </Grid>
                }
              </CardActionArea>
            </Grid>
            <Grid item>
              <Typography variant="h6">Group</Typography>
            </Grid>
            <Grid item>

            <ManageGroups {...props}
              groups={user.groups}
              getAction={GET_USER_PROFILE_DETAILS}
              deleteAction={DELETE_GROUPS}
              putAction={PUT_GROUPS}
              postAction={POST_GROUPS}
              checkNameAction={CHECK_GROUPS_NAME}
              getRolesAction={GET_ROLES} />

            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Button className={classes.red} onClick={handleSubmit}>Submit</Button>
        </Grid>
      </Grid>
    )}
  </>
}

export default Profile;