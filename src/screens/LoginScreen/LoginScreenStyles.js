import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 30,
    paddingTop: 60, 
  },
  logo: {
    width: 40,
    height: 40,
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputUnderlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 10,
  },
  inputUnderline: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#F0E6FF',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
  },
  loginText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  registerText: {
    color: '#555',
  },
  registerLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  signUpUsing: {
    textAlign: 'center',
    color: '#444',
    marginBottom: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 15,
    paddingHorizontal: 30,
  },
});

export default styles;