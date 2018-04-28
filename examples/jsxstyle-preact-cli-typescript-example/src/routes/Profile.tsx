import { Block } from 'jsxstyle/preact';
import { Component, h } from 'preact';

interface ProfileProps {
  user?: string;
}

interface ProfileState {
  time: number;
  count: number;
}

export default class Profile extends Component<ProfileProps, ProfileState> {
  public state = {
    count: 10,
    time: Date.now(),
  };

  private timer: NodeJS.Timer;

  // gets called when this route is navigated to
  public componentDidMount() {
    // start a timer for the clock:
    this.timer = global.setInterval(this.updateTime, 1000);
  }

  // gets called just before navigating away from the route
  public componentWillUnmount() {
    global.clearInterval(this.timer);
  }

  // update the current time
  private updateTime = () => {
    this.setState({ time: Date.now() });
  };

  private increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  // Note: `user` comes from the URL, courtesy of our router
  public render({ user }: ProfileProps, { time, count }: ProfileState) {
    return (
      <Block padding="56px 20px" minHeight="100%" width="100%">
        <h1>Profile: {user}</h1>
        <p>This is the user profile for a user named {user}.</p>

        <div>Current time: {new Date(time).toLocaleString()}</div>

        <p>
          <button onClick={this.increment}>Click Me</button> Clicked {count}{' '}
          times.
        </p>
      </Block>
    );
  }
}
