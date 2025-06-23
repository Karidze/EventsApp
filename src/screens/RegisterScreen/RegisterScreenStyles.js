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
  registerButton: {
    backgroundColor: '#F0E6FF',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  registerButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#555',
  },
  loginLink: {
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
    justifyContent: 'center',
    gap: 30,
    marginBottom: 25,
  },
  privacyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#777',
    paddingHorizontal: 10,
  },
  linkText: {
    color: '#007AFF',
  },
});

export default styles;