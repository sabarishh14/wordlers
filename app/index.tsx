import { Redirect } from 'expo-router';

export default function Index() {
  // Instantly routes the user to the Welcome screen on launch
  return <Redirect href={"/welcome" as any} />;
}