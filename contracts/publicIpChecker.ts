declare module '@ioc:PublicIPChecker' {
    import checker from 'providers/PublicIPChecker/PublicIPChecker';
  
    const PublicIPChecker: checker;
    export default PublicIPChecker;
  }